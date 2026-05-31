namespace VoltRide.Api.Models
{
    public class RideHistory
    {
        public int Id { get; set; }
        public int BikeId { get; set; }
        public string? UserId { get; set; } // Email olarak tutuyoruz şimdilik
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public decimal TotalCost { get; set; }
        public string? RouteCoordinates { get; set; } // JSON listesi olarak tutacağız "[ [lat, lng], [lat, lng] ]"
    }
}
