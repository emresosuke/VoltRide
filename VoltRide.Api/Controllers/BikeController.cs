using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VoltRide.Api.Data;
using VoltRide.Api.Models;

namespace VoltRide.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BikeController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BikeController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Bike>>> GetBikes()
        {
            var bikes = await _context.Bikes.ToListAsync();
            return Ok(bikes);
        }

        [HttpPost("rent/{id}")]
        public async Task<IActionResult> RentBike(int id, [FromBody] string email)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null) return BadRequest(new { message = "Kullanıcı bulunamadı." });
            if (user.Balance <= 0) return BadRequest(new { message = "Yetersiz bakiye. Lütfen cüzdanınıza para yükleyin." });

            var bike = await _context.Bikes.FindAsync(id);
            if (bike == null || bike.Status != "Available") return BadRequest(new { message = "Bisiklet kiralanamaz durumda." });

            bike.Status = "Rented";
            
            var rideHistory = new RideHistory { 
                BikeId = id, 
                UserId = email, 
                StartTime = DateTime.UtcNow,
                TotalCost = 0,
                RouteCoordinates = $"[ [{bike.Latitude.ToString().Replace(",", ".")}, {bike.Longitude.ToString().Replace(",", ".")}] ]"
            };
            
            _context.RideHistories.Add(rideHistory);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Kiralama başarılı", logId = rideHistory.Id });
        }

        [HttpPost("return/{id}")]
        public async Task<IActionResult> ReturnBike(int id)
        {
            var bike = await _context.Bikes.FindAsync(id);
            if (bike == null || bike.Status != "Rented") return BadRequest(new { message = "Bisiklet zaten kirada değil." });

            bike.Status = "Available";
            
            var rideHistory = await _context.RideHistories.OrderByDescending(r => r.StartTime).FirstOrDefaultAsync(r => r.BikeId == id && r.EndTime == null);
            if (rideHistory != null)
            {
                rideHistory.EndTime = DateTime.UtcNow;
            }
            
            await _context.SaveChangesAsync();

            return Ok(new { message = "Teslim başarılı", totalCost = rideHistory?.TotalCost ?? 0 });
        }

        [HttpGet("history/{email}")]
        public async Task<IActionResult> GetUserHistory(string email)
        {
            var history = await _context.RideHistories
                .Where(r => r.UserId == email && r.EndTime != null)
                .OrderByDescending(r => r.StartTime)
                .ToListAsync();
            return Ok(history);
        }

        [HttpPost("lock/{id}")]
        public async Task<IActionResult> LockBike(int id)
        {
            var bike = await _context.Bikes.FindAsync(id);
            if (bike == null) return NotFound(new { message = "Bisiklet bulunamadı." });

            bike.Status = "Maintenance";

            var ride = await _context.RideHistories.FirstOrDefaultAsync(r => r.BikeId == id && r.EndTime == null);
            if (ride != null)
            {
                ride.EndTime = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = $"{bike.Name} kodlu bisiklet başarıyla bakıma alındı." });
        }

        [HttpPost("unlock/{id}")]
        public async Task<IActionResult> UnlockBike(int id)
        {
            var bike = await _context.Bikes.FindAsync(id);
            if (bike == null) return NotFound(new { message = "Bisiklet bulunamadı." });
            if (bike.Status != "Maintenance") return BadRequest(new { message = "Bisiklet zaten bakımda değil." });

            bike.Status = "Available";
            bike.BatteryLevel = 100;

            await _context.SaveChangesAsync();
            return Ok(new { message = $"{bike.Name} kodlu bisikletin bakımı tamamlandı ve sahaya sürüldü. (Batarya: %100)" });
        }

        [HttpPost("route/{id}")]
        public IActionResult SetRoute(int id, [FromBody] List<double[]> route)
        {
            VoltRide.Api.Services.BikeSimulatorService.TargetRoutes[id] = new Queue<double[]>(route);
            return Ok(new { message = "Rota başarıyla ayarlandı. Bisiklet hedefe doğru ilerliyor!" });
        }
    }
}
