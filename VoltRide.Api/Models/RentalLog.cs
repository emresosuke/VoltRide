using System;

namespace VoltRide.Api.Models
{
    public class RentalLog
    {
        public int Id { get; set; }
        public int BikeId { get; set; }
        public Bike? Bike { get; set; }
        public string? UserId { get; set; }
        public DateTime StartTime { get; set; } = DateTime.UtcNow;
        public DateTime? EndTime { get; set; }
        public decimal? TotalCost { get; set; }
    }
}
