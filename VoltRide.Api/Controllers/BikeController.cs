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
    }
}
