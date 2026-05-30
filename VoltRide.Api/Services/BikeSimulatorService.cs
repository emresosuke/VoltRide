using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using VoltRide.Api.Data;
using VoltRide.Api.Hubs;

namespace VoltRide.Api.Services
{
    public class BikeSimulatorService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly IHubContext<BikeHub> _hubContext; // 🚀 Canlı yayın için ekledik!
        private readonly Random _random = new Random();

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

                    foreach (var bike in bikes)
                    {
                        if (bike.Status == "Rented")
                        {
                            // Kiralanmış bisiklet hareket etsin
                            bike.Latitude += (_random.NextDouble() - 0.5) * 0.001;
                            bike.Longitude += (_random.NextDouble() - 0.5) * 0.001;
                            bike.BatteryLevel = Math.Max(0, bike.BatteryLevel - 2);

                            if (bike.BatteryLevel == 0)
                            {
                                bike.Status = "Maintenance";
                            }
                        }
                        else if (bike.Status == "Available" && bike.BatteryLevel < 100)
                        {
                            bike.BatteryLevel = Math.Min(100, bike.BatteryLevel + 1);
                        }
                    }

                    if (bikes.Any())
                    {
                        // Değişen bisiklet durumlarını EF Core'a "Güncellendi" olarak işaretle
                        foreach (var bike in bikes)
                        {
                            context.Entry(bike).State = EntityState.Modified;
                        }

                        await context.SaveChangesAsync(stoppingToken);
                        Console.WriteLine($"[IoT Simulator] {bikes.Count} adet bisiklet güncellendi ve canlı yayına gönderiliyor.");

                        // 🚀 İŞTE O SİHİRLİ AN: Güncel listeyi WebSocket üzerinden React'e üflüyoruz!
                        await _hubContext.Clients.All.SendAsync("ReceiveBikePositions", bikes, stoppingToken);
                    }
                }

                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }
    }
}