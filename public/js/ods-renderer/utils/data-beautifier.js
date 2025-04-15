const $ = require('jquery');

function isEmptyString(str) {
    return str == null || str === '';
}

const getFirstnameWithFrontSpace = (firstname) => {
    if (firstname && firstname !== '') {
        firstname = ` ${firstname}`;
    }
    return firstname;
};

function getAcronym(firstName = null, lastName = null) {
    let acronym = '';

    if (firstName && firstName.length > 0) {
        acronym += firstName.substring(0, 1);
    }
    if (lastName && lastName.length > 0) {
        acronym += lastName.substring(0, 1);
    }
    return acronym.toLocaleUpperCase();
}

function getFullname(firstName = null, lastName = null) {
    if (isEmptyString(firstName)) {
        return '';
    }
    return `${firstName} ${lastName}`;
}

function getNormalizedUsername(username) {
    const regex = new RegExp(`^dummysuperviseduser.[a-zA-Z0-9]{5}_(.*)@example.com$`);
    const result = regex.exec(username);

    return (result !== null && result.length > 0) ? result[1] : username;
}

function getDisplayRolename(roleName) {
    switch (roleName) {
    case 'ORG_ADMIN':
        return 'Organization Administrator';

    case 'TEACHER_ADMIN':
        return 'Class Administrator';

    case 'TEACHER':
        return 'Teacher';

    case 'SENIOR_TEACHER':
        return 'Senior Teacher';

    case 'LEARNER':
        return 'Student';

    default:
        return roleName;
    }
}

const onValidateSuccess = (error, element) => {
    if ($(element).hasClass('checkbox-input') === false) {
        $(element).parent().removeClass('form-validation-error');
        $(element).parent().addClass('form-validation-correct');
    }
    $(element).parent().parent().children('ul').hide();
    error.remove();
};

const onValidateFailed = (error, element) => {
    if ($(element).hasClass('checkbox-input') === false) {
        element.parent().removeClass('validation-none');
        element.parent().addClass('form-validation-error');
    }
    element.parent().parent().children('ul').show();
    element.parent().parent().children('ul').children('li').html(error.html());
};

module.exports = {
    getFirstnameWithFrontSpace: getFirstnameWithFrontSpace,
    getAcronym: getAcronym,
    getFullname: getFullname,
    getNormalizedUsername: getNormalizedUsername,
    getDisplayRolename: getDisplayRolename,

    onValidateSuccess: onValidateSuccess,
    onValidateFailed: onValidateFailed,
};