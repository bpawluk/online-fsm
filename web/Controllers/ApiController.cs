using System.Runtime.Intrinsics.X86;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using OnlineFSM.Models;
using OnlineFSM.Other;
using System.Text.Json;

namespace OnlineFSM.Controllers
{
    [Route("api/fsm")]
    [ApiController]
    public class ApiController : Controller
    {
        private readonly IMongoCollection<FSM> _automatas;

        public ApiController(IDatabaseSettings settings)
        {
            var client = new MongoClient(settings.ConnectionString);
            var database = client.GetDatabase(settings.DatabaseName);
            _automatas = database.GetCollection<FSM>(settings.CollectionName);
        }

        [HttpGet("{id:length(24)}")]
        public ActionResult<FSM> Get(string id)
        {
            var book = _automatas.Find<FSM>(fsm => fsm.Id == id).FirstOrDefault();

            if (book == null)
            {
                return NotFound();
            }

            return book;
        }

        [HttpPost]
        public ActionResult<FSM> Create(FSM fsm)
        {
            if (fsm.States.Length > 0)
            {
                _automatas.InsertOne(fsm);
                return CreatedAtRoute("GetAutomata", new { id = fsm.Id.ToString() }, fsm);
            }

            return BadRequest();
        }
    }
}