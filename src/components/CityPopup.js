import React, { useState, useEffect, useRef } from 'react';
import Overlay from "ol/Overlay";

const CityPopup = ({ map, feature }) => {

    const [displayName, setDisplayName] = useState();
    const [identifier, setIdentifier] = useState();
    const [alternateNames, setAlternateNames] = useState([]);

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

        setAlternateNames([]);
    }, [ map ]);

    useEffect( () => {
        if (!map) {
            return;
        }

        let cityPopupOverlay = map.getOverlayById(cityPopupOverlayId);
        if (!cityPopupOverlay) {
            return;
        }

        const altNames = [];
        if (feature) {
            const featureCoord = feature.getGeometry().getCoordinates();
            cityPopupOverlay.setPosition(featureCoord);

            // display name
            const values = feature.getProperties();
            setDisplayName(values['preferredName']);

            // identifier
            if (values['preferredName'] !== values['identifier']) {
                setIdentifier(`${values['prefix']} ${values['identifier']}`);
            }
            else {
                setIdentifier(null);
            }

            // alternate names
            for (const altName of values['altNames']) {
                if (altName.name !== values['preferredName'] && altName.name !== values['identifier']) {
                    console.log(altName)
                    altNames.push(altName);
                }
            }
            console.log(altNames);
            setAlternateNames(altNames);

            // close button
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
                { displayName }
            </div>
            { identifier ?
            <div id="city-popup-identifier-name" className="city-popup-identifier-name">
                { identifier }
            </div>
                : null
            }
            { alternateNames.length > 0 ? <div className="city-popup-alternate-name-header">Also called:</div> : null }
            <div>
                {
                    alternateNames.map(an => (
                        <div className="city-popup-alternate-name" key={ an.id }>{ an.name }</div>
                    ))
                }
            </div>
        </div>
    );
}

export default CityPopup;