using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace OnlineFSM.Models
{
    public class FSM
    {
        [BsonId]
        [JsonIgnore]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        [JsonPropertyName("states")]
        public State[] States { get; set; }

        [JsonPropertyName("transitions")]
        public Transition[] Transitions { get; set; }
    }
}