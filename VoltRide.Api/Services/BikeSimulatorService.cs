using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using VoltRide.Api.Data;
using VoltRide.Api.Hubs;
using VoltRide.Api.Models;

namespace VoltRide.Api.Services
{
    public class BikeSimulatorService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly IHubContext<BikeHub> _hubContext;
        private readonly Random _random = new Random();
        
        public static readonly System.Collections.Concurrent.ConcurrentDictionary<int, Queue<double[]>> TargetRoutes = new();

        private const double GeoCenterLat = 37.915;
        private const double GeoCenterLng = 40.218;
        private const double GeoRadius = 0.018; 

        public BikeSimulatorService(IServiceProvider serviceProvider, IHubContext<BikeHub> hubContext)
        {
            _serviceProvider = serviceProvider;
            _hubContext = hubContext;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    var bikes = await context.Bikes.AsNoTracking().ToListAsync(stoppingToken);
                    var activeRides = await context.RideHistories.Where(r => r.EndTime == null).ToListAsync(stoppingToken);

                    foreach (var bike in bikes)
                    {
                        if (bike.Status == "Rented")
                        {
                            var ride = activeRides.FirstOrDefault(r => r.BikeId == bike.Id);
                            if (ride != null)
                            {
                                var user = await context.Users.FirstOrDefaultAsync(u => u.Email == ride.UserId);
                                if (user != null)
                                {
                                    user.Balance -= 2;
                                    ride.TotalCost += 2;

                                    if (user.Balance <= 0)
                                    {
                                        user.Balance = 0;
                                        bike.Status = "Available";
                                        ride.EndTime = DateTime.UtcNow;
                                        await _hubContext.Clients.All.SendAsync("ReceiveAlert", $"Bakiye yetersiz! {bike.Name} kodlu bisikletin sürüşü durduruldu.");
                                    }
                                    
                                    context.Entry(user).State = EntityState.Modified;
                                    context.Entry(ride).State = EntityState.Modified;
                                }

                                if (bike.Status == "Rented")
                                {
                                    var coordsList = string.IsNullOrEmpty(ride.RouteCoordinates) 
                                        ? new List<double[]>() 
                                        : JsonSerializer.Deserialize<List<double[]>>(ride.RouteCoordinates);
                                    
                                    coordsList.Add(new[] { bike.Latitude, bike.Longitude });
                                    ride.RouteCoordinates = JsonSerializer.Serialize(coordsList);
                                }
                            }

                            if (bike.Status == "Rented")
                            {
                                if (TargetRoutes.TryGetValue(bike.Id, out var routeQueue) && routeQueue.Count > 0)
                                {
                                    var target = routeQueue.Peek();
                                    double tLat = target[0];
                                    double tLng = target[1];
                                    
                                    double step = 0.0005;
                                    double dLat = tLat - bike.Latitude;
                                    double dLng = tLng - bike.Longitude;
                                    double dist = Math.Sqrt(dLat * dLat + dLng * dLng);

                                    if (dist <= step)
                                    {
                                        bike.Latitude = tLat;
                                        bike.Longitude = tLng;
                                        routeQueue.Dequeue();
                                    }
                                    else
                                    {
                                        bike.Latitude += (dLat / dist) * step;
                                        bike.Longitude += (dLng / dist) * step;
                                    }
                                }
                                else
                                {
                                    bike.Latitude += (_random.NextDouble() - 0.5) * 0.001;
                                    bike.Longitude += (_random.NextDouble() - 0.5) * 0.001;
                                }

                                bike.BatteryLevel = Math.Max(0, bike.BatteryLevel - 2);

                                double distanceSq = Math.Pow(bike.Latitude - GeoCenterLat, 2) + Math.Pow(bike.Longitude - GeoCenterLng, 2);
                                if (distanceSq > GeoRadius * GeoRadius)
                                {
                                    await _hubContext.Clients.All.SendAsync("ReceiveAlert", $"DİKKAT: {bike.Name} izin verilen bölgenin dışına çıkıyor!");
                                }

                                if (bike.BatteryLevel == 0)
                                {
                                    bike.Status = "Maintenance";
                                    if (ride != null) ride.EndTime = DateTime.UtcNow;
                                    await _hubContext.Clients.All.SendAsync("ReceiveAlert", $"Acil Durum: {bike.Name} bataryası bitti ve yolda kaldı!");
                                }
                            }
                        }
                        else if (bike.Status == "Available" && bike.BatteryLevel < 100)
                        {
                            bike.BatteryLevel = Math.Min(100, bike.BatteryLevel + 1);
                        }
                    }

                    if (bikes.Any())
                    {
                        foreach (var bike in bikes)
                        {
                            context.Entry(bike).State = EntityState.Modified;
                        }

                        await context.SaveChangesAsync(stoppingToken);
                        await _hubContext.Clients.All.SendAsync("ReceiveBikePositions", bikes, stoppingToken);
                        
                        foreach(var ride in activeRides.Where(r => r.EndTime == null))
                        {
                            var user = await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == ride.UserId);
                            if(user != null) {
                                await _hubContext.Clients.All.SendAsync("ReceiveWalletUpdate", new { email = user.Email, balance = user.Balance });
                                await _hubContext.Clients.All.SendAsync("ReceiveLiveRoute", new { email = user.Email, route = ride.RouteCoordinates });
                            }
                        }
                    }
                }

                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }
    }
}