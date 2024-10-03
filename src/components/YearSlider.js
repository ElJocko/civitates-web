import React, { useState, useEffect, useRef } from 'react';

import ReactSlider from "react-slider";

const Slider = ({ onChange, initialYear }) => {

    const [currentYear, setCurrentYear] = useState(initialYear);
    const [displayYear, setDisplayYear] = useState(initialYear);
    const [displayYearPostfix, setDisplayYearPostfix] = useState('AD');

    function updateYear(year) {
        if (year === 0) {
            setCurrentYear(1);
            setDisplayYear(1);
            setDisplayYearPostfix('AD');
        }
        else if (year > 0) {
            setCurrentYear(year);
            setDisplayYear(year);
            setDisplayYearPostfix('AD');
        }
        else {
            setCurrentYear(year);
            setDisplayYear(year * -1);
            setDisplayYearPostfix('BC');
        }
    }

    const yearChangeHandler = (year) => {
        updateYear(year);
        onChange(currentYear);
    }

    const afterYearChangeHandler = (year) => {
        // We need this handler because onChange only fires for some positions of the slider--and usually
        // misses the final position
        updateYear(year);
        onChange(currentYear);
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
                min={ -1600 }
                max={ 1600 }
            />
        </div>
    );
}

export default Slider;