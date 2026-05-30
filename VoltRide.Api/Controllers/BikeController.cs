using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VoltRide.Api.Data;
using VoltRide.Api.Models;

namespace VoltRide.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BikeController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BikeController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Bike
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Bike>>> GetBikes()
        {
            var bikes = await _context.Bikes.ToListAsync();
            return Ok(bikes);
        }

        [HttpPost("rent/{id}")]
        public async Task<IActionResult> RentBike(int id, [FromBody] string email)
        {
            var bike = await _context.Bikes.FindAsync(id);
            if (bike == null || bike.Status != "Available") return BadRequest(new { message = "Bisiklet kiralanamaz durumda." });

            bike.Status = "Rented";
            
            var rentalLog = new RentalLog { BikeId = id, UserId = email, StartTime = DateTime.UtcNow };
            _context.RentalLogs.Add(rentalLog);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Kiralama başarılı", logId = rentalLog.Id });
        }

        [HttpPost("return/{id}")]
        public async Task<IActionResult> ReturnBike(int id)
        {
            var bike = await _context.Bikes.FindAsync(id);
            if (bike == null || bike.Status != "Rented") return BadRequest(new { message = "Bisiklet zaten kirada değil." });

            bike.Status = "Available";
            
            var rentalLog = await _context.RentalLogs.OrderByDescending(r => r.StartTime).FirstOrDefaultAsync(r => r.BikeId == id && r.EndTime == null);
            if (rentalLog != null)
            {
                rentalLog.EndTime = DateTime.UtcNow;
                rentalLog.TotalCost = 50; // örnek fiyat
            }
            
            await _context.SaveChangesAsync();

            return Ok(new { message = "Teslim başarılı" });
        }
    }
}
