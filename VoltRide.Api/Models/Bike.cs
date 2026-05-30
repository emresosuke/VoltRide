namespace VoltRide.Api.Models
{
    public class Bike
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Status { get; set; } = "Available";
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int BatteryLevel { get; set; } = 100;
    }
}
