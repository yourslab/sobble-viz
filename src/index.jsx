import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import DeckGL from '@deck.gl/react';
import { ScenegraphLayer } from '@deck.gl/mesh-layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { IconLayer } from '@deck.gl/layers';
import { EditableGeoJsonLayer } from '@nebula.gl/layers';
import { GLTFScenegraphLoader } from '@luma.gl/addons';
import { registerLoaders } from '@loaders.gl/core';
import ReactMapGL, { Layer, StaticMap } from 'react-map-gl';
import { congData } from './data/cong.js';

const ICON_MAPPING = {
  marker: {
    x: 0, y: 0, width: 128, height: 128, mask: true,
  },
};

// ScenegraphLayer will automatically pick the right
// loader for the file type from the registered loaders.
registerLoaders([GLTFScenegraphLoader]);

// Change this to your model
const GLTF_URL = 'https://raw.githubusercontent.com/yourslab/sobble-assets/master/car/scene.gltf';

// Change this to your access token
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiZ2Vvcmdpb3MtdWJlciIsImEiOiJjanZidTZzczAwajMxNGVwOGZrd2E5NG90In0.gdsRu_UeU_uPi9IulBruXA';

const initialViewState = {
  latitude: 37.7750068,
  longitude: -122.41318080000002,
  zoom: 14,
  pitch: 60,
};

const buildingLayer = {
  id: '3d-buildings',
  source: 'composite',
  'source-layer': 'building',
  filter: ['==', 'extrude', 'true'],
  type: 'fill-extrusion',
  minzoom: 10,
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

function setTooltip(object, x, y) {
  const el = document.getElementById('tooltip');
  if (object) {
    el.innerHTML = object.message;
    el.style.display = 'block';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  } else {
    el.style.display = 'none';
  }
}

class DeckWithMaps extends Component {
  constructor(props) {
    super(props);
    this.state = {
      time: 0,
      data: congData,
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

  componentDidMount() {
    this.interval = setInterval(() => {
      this.setState((prevState) => ({ time: prevState.time + 1 }));
    }, 100);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  _renderTooltip() {
    const { hoveredObject, pointerX, pointerY } = this.state || {};
    return hoveredObject && (
      <div style={{
        position: 'absolute',
        zIndex: 1,
        pointerEvents: 'none',
        left: pointerX,
        top: pointerY,
      }}
      >
        { pointerX }
      </div>
    );
  }

  render() {
    const { geojson, data, time } = this.state;
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
      data: data.basicIcons,
      pickable: true,
      // iconAtlas and iconMapping are required
      // getIcon: return a string
      iconAtlas: './assets/icon-atlas.png',
      iconMapping: ICON_MAPPING,
      getIcon: (d) => 'marker',
      sizeScale: 15,
      getPosition: (d) => d.coordinates,
      getSize: (d) => 5,
      getColor: (d) => [Math.sqrt(d.exits), 140, 0],
      onHover: (info) => this.setState({
        hoveredObject: info.object,
        pointerX: info.x,
        pointerY: info.y,
      }),
      onClick: (info) => this.setState({
        hoveredObject: info.object,
        pointerX: info.x,
        pointerY: info.y,
      }),
    });

    const tripsLayer = new TripsLayer({
      id: 'trips-layer',
      data: data.routes,
      getPath: (d) => d.waypoints.map((p) => p.coordinates),
      // deduct start timestamp from each data point to avoid overflow
      getTimestamps: (d) => d.waypoints.map((p) => p.timestamp - 1554772579000),
      getColor: [253, 128, 93],
      opacity: 0.8,
      widthMinPixels: 5,
      rounded: true,
      trailLength: 200,
      currentTime: this.time,
    });


    // This layer renders the glTF objects
    const scenegraphLayer = new ScenegraphLayer({
      id: 'scene',
      scenegraph: GLTF_URL,
      data: geojson.features,
      getPosition: (f) => f.geometry.coordinates,
      sizeScale: 0.1,
      getOrientation: [0, 0, 0],
      getTranslation: [0, 0, 0],
      getScale: [1, 1, 1],
    });

    return (
      <DeckGL
        initialViewState={initialViewState}
        controller
        layers={[tripsLayer, basicIconLayer]}
        getCursor={() => 'cell'}
      >
        <ReactMapGL mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN}>
          <Layer {...buildingLayer} />
          { this._renderTooltip() }
        </ReactMapGL>
      </DeckGL>
    );
  }
}

export default DeckWithMaps;
ReactDOM.render(<DeckWithMaps />, document.getElementById('root'));
