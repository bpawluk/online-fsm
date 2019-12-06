using System;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using OnlineFSM.Models;
using OnlineFSM.Other;

namespace OnlineFSM.Controllers
{
    [Route("api/fsm")]
    [ApiController]
    public class ApiController : Controller
    {
        private readonly IMongoCollection<FSM> _automatas;

        public ApiController(IDatabaseSettings settings)
        {
            try
            {
                var client = new MongoClient(settings.ConnectionString);
                var database = client.GetDatabase(settings.DatabaseName);
                _automatas = database.GetCollection<FSM>(settings.CollectionName);
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
            }
        }

        [HttpGet("{id:length(24)}")]
        public ActionResult<FSM> Get(string id)
        {
            FSM fsm = null;

            try
            {
                fsm = _automatas?.Find<FSM>(fsm => fsm.Id == id).FirstOrDefault();
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
            }

            if (fsm == null)
            {
                return NotFound();
            }

            return fsm;
        }

        [HttpPost]
        public ActionResult<FSM> Create(FSM fsm)
        {
            if (fsm.States.Length > 0 && _automatas != null)
            {
                try
                {
                    _automatas.InsertOne(fsm);
                    return CreatedAtRoute("GetAutomata", new { id = fsm.Id.ToString() }, fsm);
                }
                catch (Exception e)
                {
                    Console.WriteLine(e.Message);
                }
            }

            return BadRequest();
        }
    }
}