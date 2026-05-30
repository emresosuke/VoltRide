using Microsoft.EntityFrameworkCore;
using VoltRide.Api.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSignalR(); // SignalR servisini motor kurgusuna ekle
builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173") // React varsayılan portu
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // WebSocket bağlantıları için bu şarttır!
    });
});

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddHostedService<VoltRide.Api.Services.BikeSimulatorService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.UseCors("AllowReactApp");

// React arayüzü bu adrese WebSocket ile bağlanacak
app.MapHub<VoltRide.Api.Hubs.BikeHub>("/bikehub");
var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast")
.WithOpenApi();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    context.Database.EnsureCreated(); // Tabloları otomatik oluştur

    // Eğer veritabanı boşsa başlangıç için Diyarbakır veya Antalya koordinatlarında bisiklet ekleyelim!
    if (!context.Bikes.Any())
    {
        context.Bikes.AddRange(
            new VoltRide.Api.Models.Bike { Name = "Volt-01 (Dicle)", Latitude = 37.915, Longitude = 40.218, BatteryLevel = 85, Status = "Available" },
            new VoltRide.Api.Models.Bike { Name = "Volt-02 (Sur)", Latitude = 37.910, Longitude = 40.230, BatteryLevel = 90, Status = "Rented" },
            new VoltRide.Api.Models.Bike { Name = "Volt-03 (Kampüs)", Latitude = 37.925, Longitude = 40.205, BatteryLevel = 12, Status = "Available" }
        );
        context.SaveChanges();
    }
}

app.MapControllers();
app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
