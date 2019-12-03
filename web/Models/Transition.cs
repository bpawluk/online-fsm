using System.Text.Json.Serialization;

namespace OnlineFSM.Models
{
    public class Transition
    {
        [JsonPropertyName("con")]
        public string Condition { get; set; }

        [JsonPropertyName("frm")]
        public int From { get; set; }

        [JsonPropertyName("to")]
        public int To { get; set; }

        [JsonPropertyName("sag")]
        public double? Sagitta { get; set; }

        [JsonPropertyName("rev")]
        public bool? Reversed { get; set; }

        [JsonPropertyName("dir")]
        public Vector Direction { get; set; }
    }
}