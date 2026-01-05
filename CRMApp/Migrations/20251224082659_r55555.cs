using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRMApp.Migrations
{
    /// <inheritdoc />
    public partial class r55555 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CustomerInteractionReferrals_CustomerInteractions_InteractionId",
                table: "CustomerInteractionReferrals");

            migrationBuilder.DropIndex(
                name: "IX_CustomerInteractionReferrals_InteractionId",
                table: "CustomerInteractionReferrals");

            migrationBuilder.RenameColumn(
                name: "InteractionId",
                table: "CustomerInteractionReferrals",
                newName: "CustomerId");

            migrationBuilder.AddColumn<int>(
                name: "CustomerInteractionId",
                table: "CustomerInteractionReferrals",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsIndividual",
                table: "CustomerInteractionReferrals",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_CustomerInteractionReferrals_CustomerId_IsIndividual",
                table: "CustomerInteractionReferrals",
                columns: new[] { "CustomerId", "IsIndividual" },
                unique: true,
                filter: "[IsActive] = 1");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerInteractionReferrals_CustomerInteractionId",
                table: "CustomerInteractionReferrals",
                column: "CustomerInteractionId");

            migrationBuilder.AddForeignKey(
                name: "FK_CustomerInteractionReferrals_CustomerInteractions_CustomerInteractionId",
                table: "CustomerInteractionReferrals",
                column: "CustomerInteractionId",
                principalTable: "CustomerInteractions",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CustomerInteractionReferrals_CustomerInteractions_CustomerInteractionId",
                table: "CustomerInteractionReferrals");

            migrationBuilder.DropIndex(
                name: "IX_CustomerInteractionReferrals_CustomerId_IsIndividual",
                table: "CustomerInteractionReferrals");

            migrationBuilder.DropIndex(
                name: "IX_CustomerInteractionReferrals_CustomerInteractionId",
                table: "CustomerInteractionReferrals");

            migrationBuilder.DropColumn(
                name: "CustomerInteractionId",
                table: "CustomerInteractionReferrals");

            migrationBuilder.DropColumn(
                name: "IsIndividual",
                table: "CustomerInteractionReferrals");

            migrationBuilder.RenameColumn(
                name: "CustomerId",
                table: "CustomerInteractionReferrals",
                newName: "InteractionId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerInteractionReferrals_InteractionId",
                table: "CustomerInteractionReferrals",
                column: "InteractionId");

            migrationBuilder.AddForeignKey(
                name: "FK_CustomerInteractionReferrals_CustomerInteractions_InteractionId",
                table: "CustomerInteractionReferrals",
                column: "InteractionId",
                principalTable: "CustomerInteractions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
