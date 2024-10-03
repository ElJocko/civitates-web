import React, { useState, useEffect, useRef } from 'react';
import Overlay from "ol/Overlay";

const CityPopup = ({ map, feature }) => {

    const [displayName, setDisplayName] = useState();

    const cityPopupOverlayId = 'city-popup-overlay';

    useEffect( () => {
        if (map) {
            let cityPopupOverlay = map.getOverlayById(cityPopupOverlayId);
            if (!cityPopupOverlay) {
                // Create the popup overlay and add it to the map
                const overlayElement = document.getElementById('city-popup-overlay-element');
                cityPopupOverlay = new Overlay({
                    id: cityPopupOverlayId,
                    element: overlayElement,
                    position: undefined,
                    autoPan: {
                        animation: {
                            duration: 250,
                        },
                    },
                });

                map.addOverlay(cityPopupOverlay);
            }
        }
    }, [ map ]);

    useEffect( () => {
        if (!map) {
            return;
        }

        let cityPopupOverlay = map.getOverlayById(cityPopupOverlayId);
        if (!cityPopupOverlay) {
            return;
        }

        if (feature) {
            const featureCoord = feature.getGeometry().getCoordinates();
            cityPopupOverlay.setPosition(featureCoord);

            const values = feature.getProperties();
            let displayName = values['preferredName'];
            if (values['preferredName'] !== values['identifier']) {
                displayName = `${values['preferredName']} (${values['prefix']} ${values['identifier']})`;
            }
            setDisplayName(displayName);

            const closeButton = document.getElementById('city-popup-overlay-close-button');
            closeButton.onclick = function () {
                cityPopupOverlay.setPosition(undefined);
                closeButton.blur();
                return false;
            };
        }
        else {
            cityPopupOverlay?.setPosition(undefined);
        }
    }, [ feature ]);

    return (
        <div id="city-popup-overlay-element" className="ol-popup">
            <a href="#" id="city-popup-overlay-close-button" className="ol-popup-close-button"></a>
            <div id="city-popup-display-name" className="city-popup-display-name">
                <p>{ displayName }</p>
            </div>
        </div>
    );
}

export default CityPopup;