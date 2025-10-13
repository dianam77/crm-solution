using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace CRMApp.Models
{
    public class Province
    {
        public int ProvinceId { get; set; }
        public string Name { get; set; }

        [JsonIgnore]
        public ICollection<City> Cities { get; set; }
    }
}
