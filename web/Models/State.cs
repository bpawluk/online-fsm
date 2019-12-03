using System.Text.Json.Serialization;

namespace OnlineFSM.Models
{
    public class State
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("txt")]
        public string Name { get; set; }

        [JsonPropertyName("pos")]
        public Vector Position { get; set; }

        [JsonPropertyName("acc")]
        public bool IsAccepting { get; set; }

        [JsonPropertyName("ent")]
        public bool IsEntry { get; set; }
    }
}