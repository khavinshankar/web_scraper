const request = require("request-promise");
const cheerio = require("cheerio");
const fs = require("fs");

const url = "https://www.screener.in/company/PFC/consolidated/";
main(url);

async function main(url) {
  const document = await request.get(url);
  const $ = await cheerio.load(document);
  const data = scrape($);

  //save_as_json(data);
  save_as_csv(data);
}

function scrape($) {
  const pg = [];
  const tables = $("table");
  tables.each((i, table) => {
    let tbl = [];
    $(table)
      .find("tr")
      .each((j, row) => {
        let rw = [];
        $(row)
          .find("td, th")
          .each((k, element) => {
            rw.push(
              $(element)
                .text()
                .trim()
            );
          });
        tbl.push(rw);
      });
    pg.push(tbl);
  });

  return pg;
}

function save_as_json(data) {
  const page = {};

  for (let i = 0; i < data.length; i++) {
    let table = {};
    for (let j = 0; j < data[i].length; j++) {
      table[`row${j + 1}`] = data[i][j];
    }
    page[`table${i + 1}`] = table;
  }

  fs.writeFileSync("./data/page.json", JSON.stringify(page));
}

function save_as_csv(data) {
  let string = "";

  for (let i = 0; i < data.length; i++) {
    string = string.concat(`table${i + 1}\n`);

    for (let j = 0; j < data[i].length; j++) {
      for (let k = 0; k < data[i][j].length; k++) {
        string = string.concat(`"${data[i][j][k]}",`);
      }
      string = string.concat(`\n`);
    }
    string = string.concat(`\n`);
  }

  fs.writeFileSync("./data/page.csv", string);
}
