const NetworkUtils = require('../utils/network-utils');
const DatabaseStatement = require('../database/db-gradebook-statement');
const DatabaseExerciseAnswer = require('../database/db-gradebook-exercise-answer');
const DatabaseExerciseStatus = require('../database/db-gradebook-exercise-status');
const ExerciseSubmitCountDatabase = require('../database/db-gradebook-submit-count');
const LearningRecordService = require('../middleware/learning-record-service');
const { ExerciseStatus } = require('../database/entity/exercise-status-entity');
const { StatementType } = require('../database/entity/statement-entity');

// noinspection JSUnresolvedVariable
class GradebookClient {

    normalizeStatement(statement) {
        let obj = JSON.parse(statement);

        if (obj && obj.length && obj.length > 0) {
            obj = obj[0];
        }
        return JSON.stringify(obj);
    }

    async aggregateExerciseStatus(userId, productId) {
        const entities = await DatabaseExerciseStatus.aggregate({ userId, productId });
        const exercisesStatus = {};

        if (entities && entities.length > 0) {
            for (const entity of entities) {
                if (entity && entity.exerciseId) {
                    exercisesStatus[entity.exerciseId] = {
                        submitted: entity.submitted || false,
                        revealed: entity.revealed || false,
                        status: entity.status
                    };
                }
            }
        }
        return exercisesStatus;
    }

    invalidateWorkbookStatementHistory(userId, productId, exerciseIds) {
        if (NetworkUtils.isOffline()) {
            return this.queryExerciseSubmittedHistoryFromLocal(userId, productId, exerciseIds);
        } else {
            return this.queryExerciseSubmittedHistoryFromRemote(userId, productId, exerciseIds);
        }
    }

    queryExerciseSubmittedHistoryFromLocal(userId, productId, exerciseIds) {
        return new Promise(async (resolve) => {
            const response = {
                "status": "success",
                "exist": {},
            }

            for (const exerciseId of exerciseIds) {
                const found = await DatabaseExerciseStatus.find({ userId, productId, exerciseId });

                response["exist"][exerciseId] = found?.status === ExerciseStatus.SUBMITTED;
            }
            resolve(response);
        });
    }

    queryExerciseSubmittedHistoryFromRemote(userId, productId, exerciseIds) {
        return new Promise(async (resolve, reject) => {
            try {
                const response = await LearningRecordService.aggregateSubmittedHistory(productId, exerciseIds);

                if (response?.statusCode === 200 && response?.body?.exist) {
                    for (const [exerciseId, value] of Object.entries(response.body.exist)) {
                        if (exerciseId && value) {
                            await DatabaseExerciseStatus.markAsSubmitted(userId, productId, exerciseId);
                        }
                    }
                    resolve(response.body);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    async clearExerciseStatus(userId, productId, exerciseId) {
        await DatabaseExerciseStatus.cleared(userId, productId, exerciseId);
    }

    fetchExerciseSubmitCount(userId, productId) {
        if (NetworkUtils.isOffline()) {
            return this.fetchExerciseSubmitCountFromLocal(userId, productId);
        } else {
            return this.fetchExerciseSubmitCountFromRemote(userId, productId);
        }
    }

    fetchExerciseSubmitCountFromLocal(userId, productId) {
        return new Promise(async (resolve) => {
            const exercises = [];
            const rows = await ExerciseSubmitCountDatabase.aggregate({ userId, productId });

            for (const row of rows) {
                exercises.push({
                    id: row.exerciseId,
                    count: row.count,
                });
            }
            resolve(exercises);
        });
    }

    fetchExerciseSubmitCountFromRemote(userId, productId) {
        return new Promise(async (resolve, reject) => {
            try {
                const response = await LearningRecordService.aggregateSubmitCount(productId);

                if (response?.statusCode === 200 && response?.body?.exercises) {
                    for (const { id, count } of response?.body?.exercises) {
                        await ExerciseSubmitCountDatabase.setSubmitCount(userId, productId, id, count);
                    }
                    resolve(response.body.exercises);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     *  Step 1. Update ExerciseStatus from ExerciseDatabase
     *  Step 2. Insert RevealStatement to StatementDatabase
     *  Step 3. Request <Upload-RevealStatement> to OUP LRS via Gradebook API
     *  Step 4. If Step 3 is successful, then Remove RevealStatement from StatementDatabase
     */
    async sendRevealStatement(userId, productId, exerciseId, statement) {
        statement = this.normalizeStatement(statement);

        await DatabaseExerciseStatus.revealed(userId, productId, exerciseId);
        await DatabaseStatement.insert({
            userId: userId,
            type: StatementType.REVEAL,
            statement: statement,
        });

        if (NetworkUtils.isOffline()) return;

        try {
            const serializedStatement = `[${statement}]`;
            const response = await LearningRecordService.submitRevealStatements(serializedStatement);

            if (response.statusCode === 200) {
                await DatabaseStatement.remove({
                    userId: userId,
                    type: StatementType.REVEAL,
                    statement: statement,
                });
            }
        } catch (ignore) {}
    }


    /**
     *  Step 1. Update ExerciseStatus from ExerciseDatabase
     *  Step 2. Insert ExerciseAnswer to StatementDatabase
     *  Step 3. Request <Submit-ExerciseAnswer> to Gradebook API
     *  Step 4. If Step 3 is successful, then Remove WorkbookStatement from StatementDatabase
     */
    async sendExerciseAnswer(
        {
            userId,
            organizationIds,
            groupIds,
            productId,
            exerciseId,
            timestamp,
            score,
            revealed,
            answers,
        }
    ) {
        const exerciseAnswer = {
            userId,
            organizationIds,
            groupIds,
            productId,
            exerciseId,
            timestamp,
            score,
            revealed,
            answers,
        };

        await DatabaseExerciseStatus.submitted(userId, productId, exerciseId);
        await ExerciseSubmitCountDatabase.incrementSubmitCount(userId, productId, exerciseId);
        await DatabaseExerciseAnswer.insert({ userId, exerciseAnswer });

        if (NetworkUtils.isOffline()) return;

        try {
            const payload = JSON.stringify([exerciseAnswer]);
            const response = await LearningRecordService.submitAnswerStatements(payload);

            if (response.statusCode === 200 || response.statusCode === 201) {
                await DatabaseExerciseAnswer.remove({ userId, exerciseAnswer });
            }
        } catch (ignore) {}
    }


    /**
     *  Flush Pending Statements
     */
    async sendPendingStatements(userId) {
        if (NetworkUtils.isOffline()) return;

        try {
            await this.sendPendingRevealStatements(userId);
            await this.sendPendingExerciseAnswers(userId);
        } catch (e) {
            console.error(e);
        }
    }

    async sendPendingRevealStatements(userId) {
        const statements = await this.getPendingStatements(userId, StatementType.REVEAL);

        if (statements.length > 0) {
            const payload = JSON.stringify(statements);
            const response = await LearningRecordService.submitRevealStatements(payload);

            if (response.statusCode === 200) {
                await DatabaseStatement.remove({
                    userId: userId,
                    type: StatementType.REVEAL,
                });
            }
        }
    }

    async sendPendingExerciseAnswers(userId) {
        const exerciseAnswers = await this.getPendingExerciseAnswers(userId);

        if (exerciseAnswers.length > 0) {
            const payload = JSON.stringify(exerciseAnswers);
            const response = await LearningRecordService.submitAnswerStatements(payload);

            if (response.statusCode === 200 || response.statusCode === 201) {
                await DatabaseExerciseAnswer.remove({ userId });
            }
        }
    }

    async getPendingStatements(userId, type) {
        const rows = await DatabaseStatement.aggregate({ userId, type });
        const statements = [];

        for (const row of rows) {
            try {
                statements.push(JSON.parse(row.statement));
            } catch (e) {
                console.error(e);
            }
        }
        return statements;
    }

    async hasPendingStatements(userId) {
        const workbookStatements = await this.getPendingStatements(userId, StatementType.WORKBOOK);
        const revealStatements = await this.getPendingStatements(userId, StatementType.REVEAL);
        const exerciseAnswers = await this.getPendingExerciseAnswers(userId);

        return (workbookStatements.length > 0
            || revealStatements.length > 0
            || exerciseAnswers.length > 0);
    }

    async getPendingExerciseAnswers(userId) {
        const entities = await DatabaseExerciseAnswer.aggregate({ userId });
        const exerciseAnswers = [];

        for (const entity of entities) {
            if (entity?.exerciseAnswer) {
                exerciseAnswers.push(entity.exerciseAnswer);
            }
        }
        return exerciseAnswers;
    }
}

module.exports = new GradebookClient();