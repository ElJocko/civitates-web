const showNameValues = { periodName: 'periodName', commonName: 'commonName' };
const eraDesignationValues = { bcad: 'bcad', bcece: 'bcece' };

const defaultShowName = showNameValues.periodName;
const defaultEraDesignation = eraDesignationValues.bcece;
const defaultMinYear = -1600;
const defaultMaxYear = 1600;

const options = {
    showName: defaultShowName,
    eraDesignation: defaultEraDesignation,
    minYear: defaultMinYear,
    maxYear: defaultMaxYear
};

const getShowName = function() {
    return options.showName;
}

const setShowName = function(name) {
    options.showName = name;
}

const getEraDesignation = function() {
    return options.eraDesignation;
}

const setEraDesignation = function(designation) {
    options.eraDesignation = designation;
}

const getMinYear = function() {
    return options.minYear;
}

const setMinYear = function(year) {
    options.minYear = year;
}

const getMaxYear = function() {
    return options.maxYear;
}

const setMaxYear = function(year) {
    options.maxYear = year;
}

export default {
    getShowName, setShowName, showName: showNameValues,
    getEraDesignation, setEraDesignation, eraDesignation: eraDesignationValues,
    getMinYear, setMinYear, getMaxYear, setMaxYear
}
