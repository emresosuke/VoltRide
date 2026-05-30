using Microsoft.EntityFrameworkCore;
using VoltRide.Api.Models;

namespace VoltRide.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Bike> Bikes { get; set; }
        public DbSet<RentalLog> RentalLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // PostgreSQL/SQLite uyumluluğu için tüm isimleri küçük harfe zorla
            foreach (var entity in modelBuilder.Model.GetEntityTypes())
            {
                entity.SetTableName(entity.GetTableName()?.ToLowerInvariant());
                foreach (var property in entity.GetProperties())
                {
                    property.SetColumnName(property.GetColumnName()?.ToLowerInvariant());
                }
            }
        }
    }
}