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
import { Circle as CircleStyle, Style, Stroke, Fill, Text } from "ol/style";

// components
import CityPopup from "./CityPopup";

const romeCoordinates4326 = [12.4839, 41.89474];
const romeCoordinates3857 = transform(romeCoordinates4326, 'EPSG:4326', 'EPSG:3857');
const mapExtent4326 = [-180, -85.051129, 180, 85.051129];
const defaultZoom = 6;
const showGhostCities = true;

// 2  4  0
// 6  .  5
// 3  7  1
const tagTextAlign = ['left', 'left', 'right', 'right', 'center', 'left', 'right', 'center'];
const tagTextBaseline = ['bottom', 'top', 'bottom', 'top', 'bottom', 'middle', 'middle', 'top'];
const tagOffsetX = [10, 10, -10, -10, 0, 10, -10, 0];
const tagOffsetY = [0, 0, 0, 0, -7, 0, 0, 7];
const tagFont = ['17px sans-serif', '15px sans-serif', '14px sans-serif', '13px sans-serif', '11px sans-serif'];
const createTextStyle = function(feature) {
    const tagPosition = feature.get('tagPosition');
    const size = feature.get('size');

    let offsetX = tagOffsetX[tagPosition];
    if (size === '4') {
        offsetX = offsetX / 2;
    }
    return new Text({
        textAlign: tagTextAlign[tagPosition],
        textBaseline: tagTextBaseline[tagPosition],
        font: tagFont[size],
        text: feature.get('preferredName'),
        fill: new Fill({ color: 'black' }),
        stroke: new Stroke({ color: 'white', width: 2 }),
        offsetX: offsetX,
        offsetY: tagOffsetY[tagPosition],
        placement: 'point',
    });
};

const circleImage0 = new CircleStyle({ radius: 7, fill: new Fill({ color: 'white' }), stroke: new Stroke({ color: 'black', width: 2 })});
const circleImage1 = new CircleStyle({ radius: 6.5, fill: new Fill({ color: 'white' }), stroke: new Stroke({ color: 'black', width: 2 })});
const circleImage2 = new CircleStyle({ radius: 6, fill: new Fill({ color: 'white' }), stroke: new Stroke({ color: 'black', width: 2 })});
const circleImage3 = new CircleStyle({ radius: 4, fill: new Fill({ color: 'white' }), stroke: new Stroke({ color: 'black', width: 2 })});
const circleImage4 = new CircleStyle({ radius: 3, fill: new Fill({ color: 'white' }), stroke: new Stroke({ color: 'black', width: 1 })});
const circleImages = [circleImage0, circleImage1, circleImage2, circleImage3, circleImage4];
const createImageStyle = function(feature) {
    return circleImages[feature.get('size')];
}

const zIndexBySize = [100, 90, 80, 70, 60];
const createZIndex = function(feature) {
    return zIndexBySize[feature.get('size')];
}

const circleGhostImage0 = new CircleStyle({ radius: 6, fill: new Fill({ color: 'white' }), stroke: new Stroke({ color: 'black', width: 0.5 })});
const circleGhostImage1 = new CircleStyle({ radius: 5, fill: new Fill({ color: 'white' }), stroke: new Stroke({ color: 'black', width: 0.5 })});
const circleGhostImage2 = new CircleStyle({ radius: 4, fill: new Fill({ color: 'white' }), stroke: new Stroke({ color: 'black', width: 0.5 })});
const circleGhostImage3 = new CircleStyle({ radius: 3, fill: new Fill({ color: 'white' }), stroke: new Stroke({ color: 'black', width: 0.5 })});
const circleGhostImage4 = new CircleStyle({ radius: 2, fill: new Fill({ color: 'white' }), stroke: new Stroke({ color: 'black', width: 0.5 })});
const circleGhostImages = [circleGhostImage0, circleGhostImage1, circleGhostImage2, circleGhostImage3, circleGhostImage4];
const createGhostImageStyle = function(feature) {
    return circleGhostImages[feature.get('size')];
}

const ghostZIndexBySize = [25, 20, 15, 10, 5];
const createGhostZIndex = function(feature) {
    return ghostZIndexBySize[feature.get('size')];
}

const featureResolutionThreshold = [20000, 8000, 4000, 2000, 1000];
function getFeatureStyle(feature, resolution) {
    if (resolution < featureResolutionThreshold[feature.get('size')]) {
        return new Style({ image: createImageStyle(feature), text: createTextStyle(feature), zIndex: createZIndex(feature) });
    }
    else {
        if (showGhostCities) {
            return new Style({ image: createGhostImageStyle(feature), zIndex: createGhostZIndex(feature) });
        }
        else {
            return new Style(null);
        }
    }
}

function isFeatureVisibleAtResolution(feature, resolution) {
    return resolution < featureResolutionThreshold[feature.get('size')];
}

function getLayerByName(map, name) {
    let result;
    map.getLayers().forEach(layer => {
        if (layer.get('name') === name) {
            result = layer;
        }
    });

    return result;
}

function initializeMapPosition() {
    const mapPositionAsString = localStorage.getItem('mapPosition');
    if (mapPositionAsString) {
        const mapPositionFromLocalStorage = JSON.parse(mapPositionAsString);
        return {
            center: mapPositionFromLocalStorage.center || romeCoordinates3857,
            zoom: mapPositionFromLocalStorage.zoom || defaultZoom
        }
    }
    else {
        return {
            center: romeCoordinates3857,
            zoom: defaultZoom
        }
    }
}

function saveMapPosition(center, zoom) {
    localStorage.setItem('mapPosition', JSON.stringify({ center, zoom }));
}

const mapMinZoom = 1;
const mapMaxZoom = 11;
function MapWrapper({ features }) {
    // set initial state
    const [ map, setMap ] = useState();
    const [ selectedCoord , setSelectedCoord ] = useState();
    const [ selectedFeature, setSelectedFeature ] = useState();

    // pull refs
    const mapElement = useRef();

    // create state ref that can be accessed in OpenLayers onclick callback function
    //  https://stackoverflow.com/a/60643670
    const mapRef = useRef();
    mapRef.current = map;

    // initialize map on first render - logic formerly put into componentDidMount
    useEffect( () => {
        // console.log('initial useEffect()');
        const mapExtent3857 = transformExtent(mapExtent4326, 'EPSG:4326', 'EPSG:3857');
        // console.log(romeCoordinates4326)
        // console.log(romeCoordinates3857)

        // // create and add vector source layer
        const featuresLayer = new VectorLayer({ source: new VectorSource(), style: getFeatureStyle });
        featuresLayer.set('name', 'features-layer', true);

        const mapPosition = initializeMapPosition();
        // console.log(mapPosition);

        // create map
        const initialMap = new Map({
            target: mapElement.current,
            layers: [
                // CAWM Map Tiles
                new TileLayer({
                    // source: new OSM(),
                    source: new XYZ({
                        attributions: 'Map tiles created by Consortium of Ancient World Mappers and hosted by University of Iowa, copyright 2022',
                        url: 'http://cawm.lib.uiowa.edu/tiles/{z}/{x}/{y}.png'
                    }),
                    extent: mapExtent3857
                }),
                featuresLayer
            ],
            view: new View({
                projection: 'EPSG:3857',
                extent: mapExtent3857,
                center: mapPosition.center,
                zoom: mapPosition.zoom,
                minZoom: mapMinZoom,
                maxZoom: mapMaxZoom,
                enableRotation: false
            }),
            controls: []
        });

        // set map onclick handler
        initialMap.on('click', handleMapClick);
        initialMap.on('moveend', handleMapMoveEnd);
        initialMap.on('pointermove', handlePointerMove);
        // initialMap.on('pointerdrag', hideCityTooltip);
        // initialMap.getTargetElement().addEventListener('pointerleave', hideCityTooltip);

        // save map reference to state
        setMap(initialMap);

        return () => initialMap.setTarget(null);
    }, []);

    // update map if features prop changes
    useEffect( () => {
        if (features.length) { // may be null on first render
            if (selectedFeature) {
                // These tests trigger when the year slider changes
                const feature = features.find(feature => feature.getProperties()['city_base_id'] === selectedFeature.getProperties()['identifier']);
                if (!feature) {
                    // selectedFeature is no longer included in the set of features
                    setSelectedFeature(undefined);
                }
                else if (!showGhostCities && !isFeatureVisibleAtResolution(feature, map.getView().getResolution())) {
                    // selectedFeature is no longer visible at this resolution
                    setSelectedFeature(undefined);
                }
            }
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
        // console.log(`new zoom is ${ newZoom }`);
        const newCenter = event.map.getView().getCenter();
        // console.log(`new center is ${ newCenter }`);

        saveMapPosition(newCenter, newZoom);

        // These tests trigger when the zoom changes
        const mapSelectedFeature = event.map.get('selectedFeature');
        if (mapSelectedFeature) {
            const layer = getLayerByName(event.map, 'features-layer');
            const foundFeature = layer.getSource().forEachFeature(layerFeature => {
                if (layerFeature.getProperties()['identifier'] === mapSelectedFeature.getProperties()['identifier']) {
                    return layerFeature;
                }
            });

            if (foundFeature) {
                if (!showGhostCities && !isFeatureVisibleAtResolution(foundFeature, event.map.getView().getResolution())) {
                    // selectedFeature is no longer visible at this resolution
                    setSelectedFeature(undefined);
                    event.map.set('selectedFeature', undefined);
                }
            }
            else {
                // selectedFeature is no longer included in the set of features
                setSelectedFeature(undefined);
                event.map.set('selectedFeature', undefined);
            }
        }

        if (showGhostCities) {
            hideCityTooltip();
        }
    }

    // map click handler
    const handleMapClick = (event) => {
        const clickedFeatures = event.map.getFeaturesAtPixel(event.pixel, { hitTolerance: 5 });
        if (clickedFeatures.length > 0) {
            setSelectedFeature(clickedFeatures[0]);
            event.map.set('selectedFeature', clickedFeatures[0]);
        }
        else {
            setSelectedFeature(undefined);
            event.map.set('selectedFeature', undefined);
        }

        if (process.env.NODE_ENV === 'development') {
            const transformedCoord = transform(event.coordinate, 'EPSG:3857', 'EPSG:4326');
            setSelectedCoord(transformedCoord);
        }
    }

    let currentFeature;
    const displayCityTooltip = function (feature, pixel) {
        const cityTooltip = document.getElementById('city-tooltip');
        if (feature) {
            cityTooltip.style.left = pixel[0] + 'px';
            cityTooltip.style.top = (pixel[1] - 18) + 'px';
            if (feature !== currentFeature) {
                cityTooltip.style.visibility = 'visible';
                cityTooltip.innerText = feature.get('preferredName');
            }
        }
        else {
            cityTooltip.style.visibility = 'hidden';
        }
        currentFeature = feature;
    };

    function hideCityTooltip() {
        const cityTooltip = document.getElementById('city-tooltip');
        cityTooltip.style.visibility = 'hidden';
        currentFeature = undefined;
    }

    const handlePointerMove = (event) => {
        if (event.dragging) {
            hideCityTooltip();
            return;
        }
        const hoveredFeatures = event.map.getFeaturesAtPixel(event.pixel, { hitTolerance: 5 });
        if (hoveredFeatures.length > 0) {
            event.map.getTargetElement().style.cursor = 'pointer';
            if (!isFeatureVisibleAtResolution(hoveredFeatures[0], event.map.getView().getResolution())) {
                displayCityTooltip(hoveredFeatures[0], event.pixel);
            }
        }
        else {
            hideCityTooltip();
            event.map.getTargetElement().style.cursor = '';
        }
    }

    // render component
    return (
        <div>
            <div ref={mapElement} className="map-container">
            </div>
            <div className="clicked-coord-label">
                <p>{(selectedCoord) ? toStringXY(selectedCoord, 5) : ''}</p>
            </div>
            <CityPopup map={map} feature={selectedFeature}/>
            <div id="city-tooltip" className="city-tooltip"></div>
        </div>
    );
}

export default MapWrapper;
