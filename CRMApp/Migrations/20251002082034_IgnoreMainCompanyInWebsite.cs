using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRMApp.Migrations
{
    /// <inheritdoc />
    public partial class IgnoreMainCompanyInWebsite : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Website",
                table: "MainCompanies");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Website",
                table: "MainCompanies",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
