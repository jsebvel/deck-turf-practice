import React, { useEffect, useState, useMemo } from 'react'
import { DeckGL } from 'deck.gl';
import { LineLayer, PolygonLayer, ScatterplotLayer } from '@deck.gl/layers';
import { Map } from 'react-map-gl/maplibre';
import * as turf from '@turf/turf';
import { Eye, EyeClosed } from "lucide-react"

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Toggle } from '@/components/ui/toggle';
import { Slider } from '@/components/ui/slider';

const INITIAL_VIEW_STATE = {
    longitude: -75.515,
    latitude: 5.072,
    zoom: 12,
    pitch: 0,
    bearing: 0
}

const restaurants = [
    { position: [-75.5175, 5.0689], name: 'La Terraza Gourmet', type: 'restaurant', address: 'Calle 23 #25-41, Manizales', phone: '(6) 887 4521' },
    { position: [-75.5142, 5.0702], name: 'El Buen Sabor', type: 'restaurant', address: 'Carrera 23 #30-15, Manizales', phone: '(6) 883 2190' },
    { position: [-75.5201, 5.0665], name: 'Restaurante Los Nevados', type: 'restaurant', address: 'Avenida Santander #45-20, Manizales', phone: '(6) 885 6734' },
    { position: [-75.5189, 5.0712], name: 'Café de la Montaña', type: 'restaurant', address: 'Calle 31 #22-10, Manizales', phone: '(6) 889 1023' },
    { position: [-75.5163, 5.0681], name: 'Parrilla El Fogón', type: 'restaurant', address: 'Carrera 25 #27-33, Manizales', phone: '(6) 884 5678' },
    { position: [-75.5088, 5.0492], name: 'Restaurante Villa María', type: 'restaurant', address: 'Calle 10 #5-22, Villamaría', phone: '(6) 859 3412' },
    { position: [-75.5102, 5.0478], name: 'El Rincón Caldense', type: 'restaurant', address: 'Carrera 8 #12-45, Villamaría', phone: '(6) 859 7821' },
    { position: [-75.5121, 5.0505], name: 'Sabores del Eje', type: 'restaurant', address: 'Calle 15 #10-30, Villamaría', phone: '(6) 859 4567' },
    { position: [-75.5195, 5.0698], name: 'Pizza y Pasta', type: 'restaurant', address: 'Calle 28 #20-18, Manizales', phone: '(6) 886 2345' },
    { position: [-75.5156, 5.0673], name: 'Asados Don Pepe', type: 'restaurant', address: 'Carrera 24 #26-50, Manizales', phone: '(6) 888 9012' }
];

interface RestaurantInfo {
    name: string | null;
    address: string | null;
    phone: string | null;
    distance?: number;
    time: string | null;
}

const MapView = () => {
    const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(null);
    const [clientPosition, setClientPosition] = useState<[number, number] | null>(null);
    const [lineToRestaurant, setLineToRestaurant] = useState<any>([]);
    const [nearestRestaurants, setNearestRestaurants] = useState<any>([]);
    const [bboxPolygon, setBboxPolygon] = useState<any>(null);
    const [perimeter, setPerimeter] = useState<any>(null);
    const [showBuffers, setShowBuffers] = useState<boolean>(true);
    const [restaurantRadius, setRestaurantRadius] = useState<number>(0.5);
    const buffers = useMemo(() => {
        const allRestaurantsPoint = turf.featureCollection(
            restaurants.map(rest => {
                const point = turf.point(rest.position);
                const distance = clientPosition ? turf.distance(turf.point(clientPosition), point, { units: 'kilometers' }) : Infinity;
                point.properties = {
                    name: rest.name,
                    address: rest.address,
                    phone: rest.phone,
                    distance,
                    time: `${((distance / 30) * 60).toFixed(2)} minutes`,
                };
                return point;
            })
        );
        const bbox = turf.bbox(allRestaurantsPoint);
        const polygon = turf.bboxPolygon(bbox);
        console.log(polygon)
        setPerimeter(turf.length(polygon, { units: 'kilometers' }).toFixed(2));
        setBboxPolygon(polygon);
        return allRestaurantsPoint.features.map(feature => {
            const buffer = turf.buffer(feature, restaurantRadius, { units: 'kilometers' });
            if (buffer) {
                buffer.properties = {
                    ...feature.properties,
                    position: feature.geometry.coordinates,
                };
            }
            return buffer;
        });
    }, [clientPosition, restaurantRadius]);

    const availableRestaurants = useMemo(() => {
        const restaurantsInRange = buffers?.filter(rest => {
            if (!clientPosition || !rest) return false;
            return turf.booleanPointInPolygon(clientPosition, rest)
        })
        const sortedRestaurants = restaurantsInRange.sort((a, b) => {
            return a.properties.distance - b.properties.distance;
        })
        if (sortedRestaurants.length > 0 && sortedRestaurants.length > 0) {
            setNearestRestaurants(turf.lineString([sortedRestaurants[0].properties.position, clientPosition!]));

        } else {
            setNearestRestaurants(null);
        }
        return sortedRestaurants;
    }, [buffers, clientPosition])

    useEffect(() => {
        if (!clientPosition) {
            setLineToRestaurant([]);
            return;
        }
        const lines = availableRestaurants?.map(rest =>
            turf.lineString([clientPosition, rest.properties.position])
        );
        console.log('Lines to restaurants:', lines);
        setLineToRestaurant(lines);
    }, [clientPosition, availableRestaurants])
    const layers = [
        new PolygonLayer({
            visible: showBuffers,

            id: 'bbox',
            data: [bboxPolygon],
            getPolygon: d => d.geometry.coordinates,
            getFillColor: [200, 200, 200, 30],
            getLineColor: [100, 100, 100, 150],
            getLineWidth: 2,
            lineWidthMinPixels: 1,
        }),

        new PolygonLayer({
            visible: showBuffers,

            id: 'buffers',
            data: buffers,
            getPolygon: d => d.geometry.coordinates,
            getFillColor: [0, 255, 0, 50],
            stroked: false,
            onHover: info => console.log(info)
        }),
        new ScatterplotLayer({
            id: 'restaurants',
            data: restaurants,
            getPosition: d => d.position,
            getFillColor: [0, 255, 0],
            pickable: true,
            onHover: info => {
                if (info.object) {
                    setRestaurantInfo({
                        name: info.object.name,
                        address: info.object.address,
                        phone: info.object.phone,
                        time: info.object.time,
                    });
                } else {
                    setRestaurantInfo(null);
                }
            },
            getRadius: 40,
        }),
        new ScatterplotLayer({
            id: 'client-position',
            data: clientPosition ? [clientPosition] : [],
            getPosition: d => d,
            getFillColor: [0, 0, 255],
            getRadius: 40,
        }),
        new LineLayer({
            id: 'lines-to-restaurants',
            data: lineToRestaurant,
            getSourcePosition: d => d.geometry.coordinates[0],
            getTargetPosition: d => d.geometry.coordinates[1],
            getColor: [255, 255, 255],
            getWidth: 2,
        }),
        new LineLayer({

            id: 'nearest-restaurant-line',
            data: nearestRestaurants ? [nearestRestaurants] : [],
            getSourcePosition: d => d.geometry.coordinates[0],
            getTargetPosition: d => d.geometry.coordinates[1],
            getColor: [255, 0, 0],
            getWidth: 4,
        }),
    ]
    return (
        <TooltipProvider>
            <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
                <DeckGL
                    initialViewState={INITIAL_VIEW_STATE}
                    controller={true}
                    layers={layers}
                    onClick={e => setClientPosition(turf.point(e.coordinate!).geometry.coordinates as [number, number])}
                >
                    <Map
                        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                    />
                </DeckGL>
                <div className='absolute ml-4 items-start text-justify '>
                    <p className='text-xl text-white'>Menu</p>
                    <p className=' text-white'>Total perimeter: {perimeter}km </p>
                    <Toggle
                        pressed={showBuffers}
                        onPressedChange={setShowBuffers}
                        className="data-[state=on]:bg-white data-[state=on]:hover:bg-white"

                    >
                        {showBuffers ? <Eye className="mr-2 text-white" /> : <EyeClosed className="mr-2 text-white" />}
                    </Toggle>

                    <Slider
                        className='mt-4 border rounded-2xl'
                        defaultValue={[0.2]}
                        max={0.5}
                        step={0.1}
                        onValueChange={(value) => setRestaurantRadius(value[0])}
                    />

                </div>
                {restaurantInfo && (
                    <Tooltip open={true}>
                        <TooltipTrigger asChild>
                            <div style={{ position: 'absolute', top: 20, right: 20 }} />
                        </TooltipTrigger>
                        <TooltipContent>
                            <div>
                                <div className="font-bold text-xl">{restaurantInfo.name}</div>
                                <div className="text-sm">{restaurantInfo.address}</div>
                                <div className="text-sm">{restaurantInfo.phone}</div>
                                <div className="text-sm">{restaurantInfo.time}</div>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                )}
                {availableRestaurants.length > 0 && (
                    <Tooltip open={true}>
                        <TooltipTrigger asChild>
                            <div style={{ position: 'absolute', top: 160, left: 20 }} />
                        </TooltipTrigger>
                        <TooltipContent className='px-4'>
                            <p className='text-2xl font-bold'>Available restaurants</p>
                            {availableRestaurants.map(restaurant => (
                                <div className='mb-4' >
                                    <div className="font-bold text-lg">{restaurant?.properties?.name}</div>
                                    <div className="text-sm">{restaurant?.properties?.distance.toFixed(2)} km</div>
                                    <div className="text-sm">{restaurant?.properties?.address}</div>
                                    <div className="text-sm">{restaurant?.properties?.phone}</div>
                                    <div className="text-sm">{restaurant?.properties?.time}</div>
                                </div>
                            ))}

                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
        </TooltipProvider>
    )
}

export default MapView;