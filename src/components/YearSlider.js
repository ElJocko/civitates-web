import React, { useState, useEffect } from 'react';

import ReactSlider from 'react-slider';

import displayOptions from '../lib/displayOptions';
import useThrottle from '../lib/useThrottle';

const Slider = ({ onChange, onFinalChange, initialYear }) => {

    const [currentYear, setCurrentYear] = useState();
    const [displayYear, setDisplayYear] = useState();
    const [displayYearPostfix, setDisplayYearPostfix] = useState();
    const [minYear, setMinYear] = useState();
    const [maxYear, setMaxYear] = useState();

    useEffect( () => {
        updateYear(initialYear)
    }, []);

    function updateYear(year) {
        setMinYear(displayOptions.getMinYear());
        setMaxYear(displayOptions.getMaxYear());
        if (year === 0) {
            setCurrentYear(1);
            setDisplayYear(1);
            if (displayOptions.getEraDesignation() === displayOptions.eraDesignation.bcad) {
                setDisplayYearPostfix('AD');
            }
            else {
                setDisplayYearPostfix('CE');
            }
            return 1;
        }
        else if (year > 0) {
            setCurrentYear(year);
            setDisplayYear(year);
            if (displayOptions.getEraDesignation() === displayOptions.eraDesignation.bcad) {
                setDisplayYearPostfix('AD');
            }
            else {
                setDisplayYearPostfix('CE');
            }
            return year;
        }
        else {
            setCurrentYear(year);
            setDisplayYear(year * -1);
            if (displayOptions.getEraDesignation() === displayOptions.eraDesignation.bcad) {
                setDisplayYearPostfix('BC');
            }
            else {
                setDisplayYearPostfix('BCE');
            }
            return year;
        }
    }

    const throttledYearChangeHandler = useThrottle((year) => {
        const updatedYear = updateYear(year);
        onChange(updatedYear);
        // console.log(`year = ${ year }, updatedYear = ${ updatedYear }`);
    });

    function yearChangeHandler(year) {
        throttledYearChangeHandler(year);
    }

    const afterYearChangeHandler = (year) => {
        // We need this handler because onChange only fires for some positions of the slider--and usually
        // misses the final position
        const updatedYear = updateYear(year);
        onFinalChange(updatedYear);
        // console.log(`FINAL year = ${ year }, updatedYear = ${ updatedYear }`);
    }

    return (
        <div className="year-slider">
            <label className="year-slider-label">{ displayYear } { displayYearPostfix } </label>
            <ReactSlider
                value={ currentYear }
                onChange={ yearChangeHandler }
                onAfterChange={ afterYearChangeHandler }
                trackClassName="year-slider-track"
                thumbClassName="year-slider-thumb"
                min={ minYear }
                max={ maxYear }
            />
        </div>
    );
}

export default Slider;