import { RouterProvider } from 'react-router';
import { router } from './routes';
import React, { useEffect, useState } from 'react';

function App() {
  const [datos, setDatos] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/services/')
      .then(response => response.json())
      .then(data => {
        console.log("Lo que llega de la API:", data); // Mira esto en la consola (F12)
        setDatos(data);
      })
      // Aquí guardas la respuesta
      .catch(error => console.error('Error:', error));
  }, []);

  // Opción A: Si quieres ver los datos antes de cargar las rutas (para probar)

 /* return (
    <div>
      <h1>Servicios Disponibles:</h1>
      {datos ? (
        <ul>
          {datos?.map((servicio) => (
            <li key={servicio.id}>
              <strong>{servicio.service_name}</strong> - ${servicio.price}
              <p>{servicio.description}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>Cargando servicios...</p>
      )}
    </div>
  );
*/


  // Opción B: Renderizar el Router (Lo correcto para que tu navegación funcione)
  // Nota: Si necesitas usar 'datos' en tus rutas, podrías pasarlos por Context o Props
  return <RouterProvider router={router} />;
}

export default App;
