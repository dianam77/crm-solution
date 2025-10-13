using CRMApp.Models;
using System.Text.Json.Serialization;

public class Address
{
    public int AddressId { get; set; }
    public int? IndividualCustomerId { get; set; }
    public CustomerIndividual? IndividualCustomer { get; set; }
    public int? CompanyCustomerId { get; set; }
    public CustomerCompany? CompanyCustomer { get; set; }

    public int? MainCompanyId { get; set; }
    public MainCompany? MainCompany { get; set; }


    public string? AddressType { get; set; }
    public int ProvinceId { get; set; }

    [JsonIgnore]
    public Province? Province { get; set; }

    public int CityId { get; set; }

    [JsonIgnore]
    public City? City { get; set; }

    public string? PostalCode { get; set; }
    public string? FullAddress { get; set; }
}
