class User {

    constructor() {
        this.osProfileName = null;

        this.userId = null;
        this.userName = null;
        this.firstName = null;
        this.lastName = null;
        this.email = null;

        this.role = null;
        this.currentOrg = null;
        this.organizations = [];

        this.missingFields = [];
    }

    invalidateDetails(response) {
        this.userName = response.user.userName;
        this.firstName = response.user.firstName;
        this.lastName = response.user.lastName;
        this.email = response.user.email;
        this.missingFields = response.user.missingFields;
        this.organizations = response.orgs;

        if (response.orgs != null && response.orgs.length > 0) {
            this.currentOrg = response.orgs[0];
        }
        this.normalizedData();
    }

    normalizedData() {
        this.userName = this.userName || '';
        this.firstName = this.firstName || '';
        this.lastName = this.lastName || '';
    }

    changeCurrentOrg(newOrgId) {
        if (this.organizations == null || this.organizations <= 0) return;

        for (const organization of this.organizations) {
            if (newOrgId === organization.customId) {
                this.currentOrg = organization;
                break;
            }
        }
    }

    getOrganizationIds() {
        const ids = [];

        if (this.organizations && this.organizations.length > 0) {
            for (const organization of this.organizations) {
                if (organization && organization.id) {
                    ids.push(organization.id);
                }
            }
        }
        return ids;
    }

    globalize() {
        global.user = this;
        global.user.id = this.userId;
    }

    static get Factory() {
        return {
            buildFromDB(data) {
                if (data && data.osProfileName) {
                    const user = new User();

                    user.osProfileName = data.osProfileName;
                    user.userId = data.userId;
                    user.userName = data.userName;
                    user.firstName = data.firstName;
                    user.lastName = data.lastName;
                    user.email = data.email;

                    user.role = data.role;
                    user.currentOrg = data.currentOrg;
                    user.organizations = data.organizations;

                    user.normalizedData();
                    user.globalize();

                    return user;
                } else {
                    return null;
                }
            },

            buildFromAPI(osProfileName, response) {
                const user = new User();

                user.osProfileName = osProfileName;
                user.userId = response.user.userId;

                user.invalidateDetails(response);
                user.globalize();

                return user;
            }
        };
    }
}

User.Roles = {
    USER: 'USER',
    LEARNER: 'LEARNER',
    TEACHER: 'TEACHER',
    ORG_ADMIN: 'ORG_ADMIN',
    TEACHER_ADMIN: 'TEACHER_ADMIN'
};

module.exports = User;