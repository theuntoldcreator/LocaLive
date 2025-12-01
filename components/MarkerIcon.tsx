import L from 'leaflet';

export const createUserMarkerIcon = (heading: number | null) => {
  const rotation = heading ?? 0;

  const svg = `
    <div style="transform: rotate(${rotation}deg); transition: transform 0.3s ease-out; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;">
      <!-- Direction Cone (White) -->
      ${heading !== null ? `
      <div style="
        position: absolute;
        width: 0; 
        height: 0; 
        border-left: 25px solid transparent;
        border-right: 25px solid transparent;
        border-bottom: 40px solid rgba(255, 255, 255, 0.2);
        top: -15px;
      "></div>
      ` : ''}
      
      <!-- Core Marker (Black) -->
      <div style="
        width: 16px;
        height: 16px;
        background-color: #000000;
        border: 2px solid #ffffff;
        border-radius: 50%;
        z-index: 10;
        position: relative;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 4px;
          height: 4px;
          background-color: #ffffff;
          border-radius: 50%;
        "></div>
      </div>
    </div>
  `;

  return L.divIcon({
    html: svg,
    className: 'custom-user-marker',
    iconSize: [60, 60],
    iconAnchor: [30, 30],
  });
};
