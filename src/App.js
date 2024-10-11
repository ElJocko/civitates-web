import './App.css';
import cityData from './data/city.json';

// react
import React, { useState, useEffect } from 'react';

// openlayers
import GeoJSON from 'ol/format/GeoJSON';

// components
import MapWrapper from './components/MapWrapper';
import YearSlider from './components/YearSlider';

import { v4 as uuidv4 } from 'uuid';

function filterByYear(feature, year) {
    for (const period of feature.getProperties().periods) {
        if (year >= period.startDate && year <= period.endDate) {
            feature.set('size', period.size, true);
            feature.set('preferredName', period.preferredName, true);
            feature.set('tagPosition', period.tagPosition, true);
            return true;
        }
    }
    return false;
}

function addAlternateNameIds(features) {
    for (const feature of features) {
        const values = feature.getProperties();
        for (const altName of values['altNames']) {
            altName.id = uuidv4();
        }
    }
}

const initialYear = 969;
function App() {
    // set initial state
    const [ allFeatures, setAllFeatures ] = useState([]);
    const [ features, setFeatures ] = useState([]);

    useEffect( () => {
        // parse fetched geojson into OpenLayers features
        // use options to convert feature from EPSG:4326 to EPSG:3857
        const wktOptions = {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
        };
        const parsedFeatures = new GeoJSON().readFeatures(cityData, wktOptions);
        addAlternateNameIds(parsedFeatures);
        const featuresForYear = parsedFeatures.filter((feature) => filterByYear(feature, initialYear));

        console.log(`started with ${ parsedFeatures.length } features, filtered to ${ featuresForYear.length } features for year ${ initialYear }`);

        // set features into state (which will be passed into OpenLayers map component as props)
        setAllFeatures(parsedFeatures);
        setFeatures(featuresForYear);
    }, []);

    function yearSliderChangeHandler(year) {
        const featuresForYear = allFeatures.filter((feature) => filterByYear(feature, year));
        console.log(`started with ${ allFeatures.length } features, filtered to ${ featuresForYear.length } features for year ${ year }`);
        setFeatures(featuresForYear);
    }

    return (
        <div className="App">
            <YearSlider onChange={ yearSliderChangeHandler } initialYear={ initialYear } />
            <MapWrapper features={ features } />
        </div>
    );
}

export default App;