using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRMApp.Migrations
{
    /// <inheritdoc />
    public partial class r : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CustomerInteractions_AspNetUsers_CurrentOwnerId",
                table: "CustomerInteractions");

            migrationBuilder.DropIndex(
                name: "IX_CustomerInteractions_CurrentOwnerId",
                table: "CustomerInteractions");

            migrationBuilder.DropColumn(
                name: "CurrentOwnerId",
                table: "CustomerInteractions");

            migrationBuilder.AddColumn<Guid>(
                name: "CurrentOwnerId",
                table: "CustomerIndividuals",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CurrentOwnerId",
                table: "CustomerCompanies",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CustomerIndividuals_CurrentOwnerId",
                table: "CustomerIndividuals",
                column: "CurrentOwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerCompanies_CurrentOwnerId",
                table: "CustomerCompanies",
                column: "CurrentOwnerId");

            migrationBuilder.AddForeignKey(
                name: "FK_CustomerCompanies_AspNetUsers_CurrentOwnerId",
                table: "CustomerCompanies",
                column: "CurrentOwnerId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_CustomerIndividuals_AspNetUsers_CurrentOwnerId",
                table: "CustomerIndividuals",
                column: "CurrentOwnerId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CustomerCompanies_AspNetUsers_CurrentOwnerId",
                table: "CustomerCompanies");

            migrationBuilder.DropForeignKey(
                name: "FK_CustomerIndividuals_AspNetUsers_CurrentOwnerId",
                table: "CustomerIndividuals");

            migrationBuilder.DropIndex(
                name: "IX_CustomerIndividuals_CurrentOwnerId",
                table: "CustomerIndividuals");

            migrationBuilder.DropIndex(
                name: "IX_CustomerCompanies_CurrentOwnerId",
                table: "CustomerCompanies");

            migrationBuilder.DropColumn(
                name: "CurrentOwnerId",
                table: "CustomerIndividuals");

            migrationBuilder.DropColumn(
                name: "CurrentOwnerId",
                table: "CustomerCompanies");

            migrationBuilder.AddColumn<Guid>(
                name: "CurrentOwnerId",
                table: "CustomerInteractions",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_CustomerInteractions_CurrentOwnerId",
                table: "CustomerInteractions",
                column: "CurrentOwnerId");

            migrationBuilder.AddForeignKey(
                name: "FK_CustomerInteractions_AspNetUsers_CurrentOwnerId",
                table: "CustomerInteractions",
                column: "CurrentOwnerId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
