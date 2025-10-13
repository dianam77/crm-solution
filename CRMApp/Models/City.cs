using System.Text.Json.Serialization;

namespace CRMApp.Models
{
    public class City
    {
        public int CityId { get; set; }
        public string Name { get; set; }

        public int ProvinceId { get; set; }
        [JsonIgnore]
        public Province Province { get; set; }
    }
}

