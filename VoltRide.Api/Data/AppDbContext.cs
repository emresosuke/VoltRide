using Microsoft.EntityFrameworkCore;
using VoltRide.Api.Models;

namespace VoltRide.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Bike> Bikes { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<RideHistory> RideHistories { get; set; }

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