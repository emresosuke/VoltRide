# 🚲 VoltRide - Real-Time Bike Rental & Tracking System

VoltRide is a modern web application where you can track the rental processes of electric bikes and monitor the real-time location/battery status of the fleet on an interactive map.

This project is built with a robust **.NET 8 Web API** backend and a premium **React** frontend. An integrated **IoT Simulator** running in the background simulates the movement and battery consumption of the bikes, broadcasting them instantly to the map via **SignalR**.

---

## ✨ Features

- **Real-Time Map Tracking:** Watch bikes move on the map without refreshing the page, thanks to Leaflet.js and SignalR WebSocket integration.
- **Live IoT Simulator:** A .NET BackgroundService simulates real-world conditions by moving rented bikes, draining their batteries, and slowly charging available bikes.
- **Bike Rental & Return:** Users can rent available bikes, end their rides, and receive a calculated total fee.
- **Modern & Sleek UI:** A rich React frontend enhanced with a Glassmorphism design language, Dark Mode support, and smooth micro-animations.
- **Entity Framework Core & SQLite:** Uses a lightweight SQLite database for quick setup and easy local development.

---

## 🛠️ Tech Stack

### Backend
- **C# / .NET 8.0**
- **ASP.NET Core Web API**
- **SignalR** (Real-time WebSocket communication)
- **Entity Framework Core** (ORM)
- **SQLite** (Database)

### Frontend
- **React.js** (Powered by Vite)
- **React Leaflet** (Interactive map rendering)
- **Lucide React** (Modern iconography)
- **Vanilla CSS3** (Custom premium design and animations)

---

## 🚀 Getting Started

Follow these steps to run the project locally. (Requires .NET 8 SDK and Node.js).

### 1. Backend (API) Setup

Open a terminal, navigate to the `VoltRide.Api` folder, and run `dotnet run` to start the application. It will automatically restore NuGet packages.

*Note: On the first run, the project will automatically create the database (`VoltRide.db`) and seed it with 3 sample bikes. The API runs on `http://localhost:5288` by default.*

### 2. Frontend (React) Setup

Open a new terminal tab, navigate to the `VoltRide.Client` folder, install NPM dependencies using `npm install`, and start the development server using `npm run dev`.

*Note: The React application will run on `http://localhost:5173` by default. Open this address in your browser to view the app.*

---

## 📂 Architecture & Important Details

- **High-Performance Simulation with AsNoTracking:** The `BikeSimulatorService.cs` bypasses EF Core's default tracking mechanism using `AsNoTracking()` to read fresh physical data from the database every 5 seconds. Modified data is explicitly marked with `EntityState.Modified` to ensure updates are broadcasted accurately via SignalR.
- **CORS & WebSocket Configuration:** To ensure smooth communication between React (`localhost:5173`) and the API (`localhost:5288`), CORS policies and SignalR Hub routing (`/bikehub`) are thoroughly configured in `Program.cs`.

---

## 📄 License

This project was built for personal development and portfolio purposes. Feel free to fork and improve it.
