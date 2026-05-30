using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VoltRide.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialVoltRideSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "bikes",
                columns: table => new
                {
                    id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    name = table.Column<string>(type: "TEXT", nullable: false),
                    status = table.Column<string>(type: "TEXT", nullable: false),
                    latitude = table.Column<double>(type: "REAL", nullable: false),
                    longitude = table.Column<double>(type: "REAL", nullable: false),
                    batterylevel = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bikes", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "rentallogs",
                columns: table => new
                {
                    id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    bikeid = table.Column<int>(type: "INTEGER", nullable: false),
                    userid = table.Column<string>(type: "TEXT", nullable: true),
                    starttime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    endtime = table.Column<DateTime>(type: "TEXT", nullable: true),
                    totalcost = table.Column<decimal>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rentallogs", x => x.id);
                    table.ForeignKey(
                        name: "FK_rentallogs_bikes_bikeid",
                        column: x => x.bikeid,
                        principalTable: "bikes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_rentallogs_bikeid",
                table: "rentallogs",
                column: "bikeid");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "rentallogs");

            migrationBuilder.DropTable(
                name: "bikes");
        }
    }
}
