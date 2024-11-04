import React, { useState, useEffect, useRef } from 'react';
import Overlay from "ol/Overlay";

import { requestPagePreview } from "../lib/api";

const buildWikipediaUrl = ( lang, title, touch, analytics = true ) => {
    return `https://${ lang }${ touch ? '.m' : '' }.wikipedia.org/wiki/${ encodeURIComponent( title ) }`
}

const CityPopup = ({ map, feature }) => {

    const [displayName, setDisplayName] = useState();
    const [identifier, setIdentifier] = useState();
    const [alternateNames, setAlternateNames] = useState([]);
    const [wikipediaText, setWikipediaText] = useState();
    const [wikipediaThumbnailUrl, setWikipediaThumbnailUrl] = useState();
    const [wikipediaLink, setWikipediaLink] = useState();

    const cityPopupOverlayId = 'city-popup-overlay';

    function clearPopupOverlay() {
        setDisplayName(null);
        setIdentifier(null);
        setAlternateNames(null);
        setWikipediaText(null);
        setWikipediaThumbnailUrl(null);
        setWikipediaLink(null);
    }

    const panOptions = { duration: 250 };
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
                    autoPan: { animation: panOptions },
                });

                map.addOverlay(cityPopupOverlay);
            }
        }

        setAlternateNames([]);
        setWikipediaText(null);
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
            clearPopupOverlay();

            // display name
            const values = feature.getProperties();
            setDisplayName(values['preferredName']);

            // identifier
            if (values['preferredName'] !== values['city_base_id']) {
                setIdentifier(`${ values['prefix'] } ${ values['city_base_id'] }`);
            }
            else {
                setIdentifier(null);
            }

            // alternate names
            for (const altName of values['altNames']) {
                if (altName.name !== values['preferredName'] && altName.name !== values['city_base_id']) {
                    altNames.push(altName);
                }
            }
            setAlternateNames(altNames);

            // close button
            const closeButton = document.getElementById('city-popup-overlay-close-button');
            closeButton.onclick = function () {
                cityPopupOverlay.setPosition(undefined);
                closeButton.blur();
                return false;
            };

            requestPagePreview('en', values['wikipediaArticleName'], (previewData) => {
                    setWikipediaText(previewData.extractHtml);
                    setWikipediaThumbnailUrl(previewData.imgUrl);
                    const wikipediaArticleUrl = buildWikipediaUrl('en', previewData.title);
                    setWikipediaLink(wikipediaArticleUrl);

                    // Timeout to allow the original animation time to complete
                    // This avoids a jerky motion when this pan starts
                    setTimeout(() => {
                        cityPopupOverlay.panIntoView(panOptions);
                    }, 300);
                }
            );

            const featureCoord = feature.getGeometry().getCoordinates();
            cityPopupOverlay.setPosition(featureCoord);
        }
        else {
            cityPopupOverlay?.setPosition(undefined);
        }
    }, [ feature ]);

    return (
        <div id="city-popup-overlay-element" className="ol-popup">
            <a href="#" id="city-popup-overlay-close-button" className="ol-popup-close-button"></a>
            <div id="city-popup-display-name" className="city-popup-display-name">
                {displayName}
            </div>
            {identifier ?
                <div id="city-popup-identifier-name" className="city-popup-identifier-name">
                    {identifier}
                </div>
                : null
            }
            <div className="city-popup-alternate-name-box">
                {alternateNames.length > 0 ? <div className="city-popup-alternate-name-header">Also called:</div> : null}
                <div>
                    {
                        alternateNames.map(an => (
                            <div className="city-popup-alternate-name" key={an.id}>{an.name}</div>
                        ))
                    }
                </div>
            </div>
            <div className="wikipediapreview">
                <div className="wikipediapreview-header">
                    <div className="wikipediapreview-header-image"
                         style={{ backgroundImage: `url(${wikipediaThumbnailUrl})` }}></div>
                    <div className="wikipediapreview-header-wordmark wikipediapreview-header-wordmark-en"></div>
                </div>
                <div className="wikipediapreview-body">
                    {wikipediaText ? <div dangerouslySetInnerHTML={{ __html: wikipediaText }}/> : null}
                    <div className="wikipediapreview-footer">
                        <div className="wikipediapreview-footer-link">
                            <a href={wikipediaLink}
                               className="wikipediapreview-footer-link-cta" target="_blank"
                            >
                                Read full article on Wikipedia&nbsp;
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
                                    <path fill="#36C" fillRule="evenodd"
                                          d="M11 1H6l2.148 2.144-4.15 4.15.707.708 4.15-4.15L11 6V1ZM4 3H2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V8H8v2H2V4h2V3Z"
                                          clipRule="evenodd"/>
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
                <div className="wikipediapreview-scroll-cue"></div>
            </div>
        </div>
    );
}

export default CityPopup;