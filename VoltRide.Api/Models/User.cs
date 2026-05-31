namespace VoltRide.Api.Models
{
    public class User
    {
        public int Id { get; set; }
        public string? Email { get; set; }
        public string? PasswordHash { get; set; }
        public string? Role { get; set; } // "Admin" veya "User"
        public decimal Balance { get; set; } // Cüzdan bakiyesi
    }
}
