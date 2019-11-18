import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import DeckGL from '@deck.gl/react';
import update from 'react-addons-update';
import { ScenegraphLayer } from '@deck.gl/mesh-layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { IconLayer } from '@deck.gl/layers';
import {
  Popover
} from 'react-bootstrap';
import { EditableGeoJsonLayer } from '@nebula.gl/layers';
import { GLTFScenegraphLoader } from '@luma.gl/addons';
import { registerLoaders } from '@loaders.gl/core';
import ReactMapGL, { Layer, StaticMap, HTMLOverlay } from 'react-map-gl';
import { congData } from './data/cong_map.js';
import App from './App.jsx';
import {EV_ICON, START_ICON, END_ICON} from './Icons.jsx';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';

// ScenegraphLayer will automatically pick the right
// loader for the file type from the registered loaders.
//registerLoaders([GLTFScenegraphLoader]);

// Change this to your model
//const GLTF_URL = 'https://raw.githubusercontent.com/yourslab/sobble-assets/master/car/scene.gltf';

// Change this to your access token
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiZ2Vvcmdpb3MtdWJlciIsImEiOiJjanZidTZzczAwajMxNGVwOGZrd2E5NG90In0.gdsRu_UeU_uPi9IulBruXA';

const initialViewState = {
  latitude: 34.07306,
  longitude: -118.2192,
  zoom: 14,
  pitch: 60,
};

const buildingLayer = {
  id: '3d-buildings',
  source: 'composite',
  'source-layer': 'building',
  filter: ['==', 'extrude', 'true'],
  type: 'fill-extrusion',
  minzoom: 1,
  paint: {
    'fill-extrusion-color': '#aaa',

    // use an 'interpolate' expression to add a smooth transition effect to the
    // buildings as the user zooms in
    'fill-extrusion-height': [
      'interpolate', ['linear'], ['zoom'],
      5, 0,
      5.05, ['get', 'height'],
    ],
    'fill-extrusion-base': [
      'interpolate', ['linear'], ['zoom'],
      5, 0,
      5.05, ['get', 'min_height'],
    ],
    'fill-extrusion-opacity': 0.6,
  },
};

class DeckWithMaps extends Component {
  constructor(props) {
    super(props);
    this.state = {
      time: 0,
      poi: congData.basicIcons.map((poi) => ({ ...poi, type: EV_ICON, color: [0, 0, 0] })),
      routes: congData.routes,
      geojson: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: [-122.469492, 37.80182],
            },
          },
        ],
      },
    };
  }

  _handleContextMenu = (event) => {
    event.preventDefault();
  };

  componentDidMount() {
    document.addEventListener('contextmenu', this._handleContextMenu);
    this.interval = setInterval(() => {
      this.setState((prevState) => ({ time: prevState.time + 1 }));
    }, 100);
  }

  componentWillUnmount() {
    document.removeEventListener('contextmenu', this._handleContextMenu);
    clearInterval(this.interval);
  }

  _renderTooltip() {
    const { hoveredObject, pointerX, pointerY } = this.state || {};
    return hoveredObject && (
      <Popover id="poi-popover" placement="right" style={{left: pointerX,top: pointerY}}>
        <Popover.Title as="h3">{pointerX}</Popover.Title>
        <Popover.Content>
          <strong>Holy guacamole!</strong> {pointerY}
        </Popover.Content>
      </Popover>
    );
  }

  _plantPin = (lat, long, icon) => {
    this.setState((prevState) => ({
      poi: [...prevState.poi, {coordinates: [long, lat], type: icon, color: [0, 0, 0] }]
    }));
    console.log(this.state.poi);
  }

  makePreferred = (info) => {
    const idx = info.index;
    this.setState({
      poi: update(this.state.poi, { [idx]: { color: { $set: [255, 0, 0] } } }),
    });
  }

  render() {
    const {
      geojson, poi, routes, time,
    } = this.state;
    // This layer provides the editable functionality
    const editableLayer = new EditableGeoJsonLayer({
      id: 'geojson',
      data: geojson,
      mode: 'drawPoint',
      onEdit: ({ updatedData }) => {
        this.setState({ geojson: updatedData });
      },
    });

    const basicIconLayer = new IconLayer({
      id: 'icon-layer',
      data: poi,
      pickable: true,
      // iconAtlas and iconMapping are required
      // getIcon: return a string,
      alphaCutoff: 0,
      autoHighlight: true,
      getIcon: (d) => d.type.marker,
      sizeScale: 15,
      getPosition: (d) => d.coordinates,
      getSize: (d) => 5,
      getColor: (d) => d.color,
      onHover: (info) => this.setState({
        hoveredObject: info.object,
        pointerX: info.x,
        pointerY: info.y,
      }),
      onClick: (info) => this.makePreferred(info),
    });

    const tripsLayer = new TripsLayer({
      id: 'trips-layer',
      data: routes,
      getPath: (d) => d.waypoints.map((p) => p.coordinates),
      // deduct start timestamp from each data point to avoid overflow
      getTimestamps: (d) => d.waypoints.map((p) => p.timestamp - 1554772579000),
      getColor: [253, 128, 93],
      opacity: 0.8,
      widthMinPixels: 5,
      rounded: true,
      trailLength: 200,
      currentTime: 0,
    });


    // This layer renders the glTF objects
    /*const scenegraphLayer = new ScenegraphLayer({
      id: 'scene',
      scenegraph: GLTF_URL,
      data: geojson.features,
      getPosition: (f) => f.geometry.coordinates,
      sizeScale: 0.1,
      getOrientation: [0, 0, 0],
      getTranslation: [0, 0, 0],
      getScale: [1, 1, 1],
    });*/

    return (
      <div>
      <DeckGL
        initialViewState={initialViewState}
        controller
        layers={[tripsLayer, basicIconLayer]}
        getCursor={() => 'cell'}
      >
          <App/>
        <ReactMapGL mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN}>
          <Layer {...buildingLayer} />
          { this._renderTooltip() }
        </ReactMapGL>
      </DeckGL>
      <App setPin={this._plantPin} />
      </div>
    );
  }
}

export default DeckWithMaps;
ReactDOM.render(<DeckWithMaps onContextMenu={(e)=> e.preventDefault()}/>, document.getElementById('root'));
