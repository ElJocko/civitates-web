// react
import React, { useState, useEffect, useRef } from 'react';

// openlayers
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import { transform, transformExtent } from 'ol/proj';
import { toStringXY } from 'ol/coordinate';
import { Circle as CircleStyle, Style, Stroke, Fill, Text } from "ol/style"

const romeCoordinates4326 = [12.4839, 41.89474];
const mapExtent4326 = [-180, -85.051129, 180, 85.051129];

// 2  4  0
// 6  .  5
// 3  7  1
const tagTextAlign = ['left', 'left', 'right', 'right', 'center', 'left', 'right', 'center'];
const tagTextBaseline = ['bottom', 'top', 'bottom', 'top', 'bottom', 'middle', 'middle', 'top'];
const tagOffsetX = [10, 10, -10, -10, 0, 10, -10, 0];
const tagOffsetY = [0, 0, 0, 0, -7, 0, 0, 7];
const tagFont = ['15px sans-serif', '14px sans-serif', '13px sans-serif', '12px sans-serif', '10px sans-serif'];
const createTextStyle = function(feature) {
    const tagPosition = feature.get('tagPosition');
    return new Text({
        textAlign: tagTextAlign[tagPosition],
        textBaseline: tagTextBaseline[tagPosition],
        font: tagFont[feature.get('size')],
        text: feature.get('preferredName'),
        fill: new Fill({ color: 'black' }),
        stroke: new Stroke({ color: 'white', width: 2 }),
        offsetX: tagOffsetX[tagPosition],
        offsetY: tagOffsetY[tagPosition],
        placement: 'point',
    });
};

const circleImage0 = new CircleStyle({ radius: 7, fill: new Fill({ color: 'white' }), stroke: new Stroke({ color: 'black', width: 2 })});
const circleImage1 = new CircleStyle({ radius: 6.5, fill: new Fill({ color: 'white' }), stroke: new Stroke({ color: 'black', width: 2 })});
const circleImage2 = new CircleStyle({ radius: 6, fill: new Fill({ color: 'white' }), stroke: new Stroke({ color: 'black', width: 2 })});
const circleImage3 = new CircleStyle({ radius: 4, fill: new Fill({ color: 'white' }), stroke: new Stroke({ color: 'black', width: 2 })});
const circleImage4 = new CircleStyle({ radius: 4, fill: new Fill({ color: 'black' })});
const circleImages = [circleImage0, circleImage1, circleImage2, circleImage3, circleImage4];
const createImageStyle = function(feature) {
    return circleImages[feature.get('size')];
}

const featureResolutionThreshold = [20000, 8000, 4000, 2000, 1500];
function getFeatureStyle(feature, resolution) {
    // console.log(resolution);
    if (resolution < featureResolutionThreshold[feature.get('size')]) {
        return new Style({image: createImageStyle(feature), text: createTextStyle(feature)});
    }
    else {
        return new Style(null);
    }
}

function MapWrapper({ features }) {
    // console.log('MapWrapper()');

    // set initial state
    const [ map, setMap ] = useState();
    const [ selectedCoord , setSelectedCoord ] = useState();

    // pull refs
    const mapElement = useRef();

    // create state ref that can be accessed in OpenLayers onclick callback function
    //  https://stackoverflow.com/a/60643670
    const mapRef = useRef();
    mapRef.current = map;

    // initialize map on first render - logic formerly put into componentDidMount
    useEffect( () => {
        console.log('initial useEffect()');
        const mapExtent3857 = transformExtent(mapExtent4326, 'EPSG:4326', 'EPSG:3857');
        const romeCoordinates3857 = transform(romeCoordinates4326, 'EPSG:4326', 'EPSG:3857');
        console.log(romeCoordinates4326)
        console.log(romeCoordinates3857)

        // // create and add vector source layer
        const featuresLayer = new VectorLayer({ source: new VectorSource(), style: getFeatureStyle });
        featuresLayer.set('name', 'features-layer', true);

        // create map
        const initialMap = new Map({
            target: mapElement.current,
            layers: [
                // CAWM Map Tiles
                new TileLayer({
                    source: new XYZ({ url: 'https://cawm.lib.uiowa.edu/tiles/{z}/{x}/{y}.png' }),
                    extent: mapExtent3857
                }),
                featuresLayer
            ],
            view: new View({
                projection: 'EPSG:3857',
                extent: mapExtent3857,
                center: romeCoordinates3857,
                zoom: 6,
                minZoom: 1,
                maxZoom: 11
            }),
            controls: []
        });
        console.log(initialMap.ol_uid);

        // set map onclick handler
        initialMap.on('click', handleMapClick);
        initialMap.on('moveend', handleMapMoveEnd);

        // save map reference to state
        setMap(initialMap);

        return () => initialMap.setTarget(null)

    }, []);

    // update map if features prop changes - logic formerly put into componentDidUpdate
    useEffect( () => {
        if (features.length) { // may be null on first render
            const featuresSource = new VectorSource({ features: features });
            const newFeaturesLayer = new VectorLayer({ source: featuresSource, style: getFeatureStyle });
            newFeaturesLayer.set('name', 'features-layer', true);

            // remove the existing features layer, if any
            map.getLayers().forEach(layer => {
                if (layer.get('name') === 'features-layer') {
                    map.removeLayer(layer);
                }
            });
            map.addLayer(newFeaturesLayer);
        }
    }, [ features ]);

    const handleMapMoveEnd = (event) => {
        const newZoom = event.map.getView().getZoom();
        console.log(`new zoom is ${ newZoom }`);
    }

    // map click handler
    const handleMapClick = (event) => {
        const clickedCoord = event.map.getCoordinateFromPixel(event.pixel);
        console.log(clickedCoord);

        // transform coord to EPSG 4326 standard Lat Long
        const transformedCoord = transform(event.coordinate, 'EPSG:3857', 'EPSG:4326');
        console.log(transformedCoord);

        // set React state
        setSelectedCoord(transformedCoord);
    }

    // render component
    return (
        <div>
            <div ref={ mapElement } className="map-container"></div>
            <div className="clicked-coord-label">
                <p>{ (selectedCoord) ? toStringXY(selectedCoord, 5) : '' }</p>
            </div>
        </div>
    );
}

export default MapWrapper;
