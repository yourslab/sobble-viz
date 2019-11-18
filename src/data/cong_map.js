const newRoutes = { routes: [{ waypoints: require('./route_shape.json').map((coord) => ({ coordinates: [coord[1], coord[0]], timestamp: 0 })) }] };
const newIcons = { basicIcons: require('./rest_loc.json').map((coord) => ({ coordinates: [coord[1], coord[0]] })) };
export const congData = { ...newRoutes, ...newIcons };
