import { useState, useEffect } from 'react';

interface WeatherData {
    temperature: number;
    windSpeed: number;
    windDirection: number;
    weatherCode: number;
}

export function useWeather(lat: number | undefined, lng: number | undefined) {
    const [weather, setWeather] = useState<WeatherData | null>(null);

    useEffect(() => {
        if (!lat || !lng) return;

        const fetchWeather = async () => {
            try {
                const response = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`
                );
                const data = await response.json();

                if (data.current_weather) {
                    setWeather({
                        temperature: data.current_weather.temperature,
                        windSpeed: data.current_weather.windspeed,
                        windDirection: data.current_weather.winddirection,
                        weatherCode: data.current_weather.weathercode,
                    });
                }
            } catch (error) {
                console.error('Failed to fetch weather data', error);
            }
        };

        fetchWeather();
        const interval = setInterval(fetchWeather, 600000); // Update every 10 mins

        return () => clearInterval(interval);
    }, [lat, lng]);

    return weather;
}
