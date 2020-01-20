const request = require("request-promise");
const cheerio = require("cheerio");
const fs = require("fs");

const url = "https://money.rediff.com/companies";
options = {
  include: [2, 3],
  exclude: [],
  format: "json", // json and csv
  file: "single", // single, multiple and both
  reverse: false,
  link: false,
  header: 0
};

main(url);

async function main(url) {
  const document = await request.get(url);
  const $ = await cheerio.load(document);
  scrape($, options);
}

function scrape($, options) {
  const pg = [];
  const tables = $("table");
  tables.each((i, table) => {
    if (
      (options.include.includes(i + 1) || options.include.length === 0) &&
      !options.exclude.includes(i + 1)
    ) {
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
              if (
                $(element)
                  .find("[href]")
                  .attr("href") &&
                options.link
              ) {
                rw.push(
                  $(element)
                    .find("[href]")
                    .attr("href")
                );
              }
            });
          tbl.push(rw);
        });

      if (options.reverse) {
        tbl = transpose(tbl);
      }

      pg.push(tbl);
    }
  });

  if (options.format === "csv") {
    save_as_csv(pg, options.file);
  } else {
    save_as_json(pg, options.file, options.header);
  }
}

function save_as_json(data, file, header) {
  const page = {};
  for (let i = 0; i < data.length; i++) {
    let table = {};
    for (let j = 0; j < data[i].length; j++) {
      if (header || header === 0) {
        if (header < data[i].length) {
          const head = data[i][j].splice(header, 1);
          if (head) {
            table[`${head}`] = data[i][j];
          } else {
            table[`row${j + 1}`] = data[i][j];
          }
        }
      } else {
        table[`row${j + 1}`] = data[i][j];
      }
    }
    if (file !== "single") {
      fs.writeFileSync(
        `./data/tables/table${i + 1}.json`,
        JSON.stringify(table)
      );
    }

    page[`table${i + 1}`] = table;
  }
  if (file !== "multiple") {
    fs.writeFileSync(`./data/page.json`, JSON.stringify(page));
  }
}

function save_as_csv(data, file) {
  let page = "";

  for (let i = 0; i < data.length; i++) {
    page = page.concat(`table${i + 1}\n`);
    let string = "";
    for (let j = 0; j < data[i].length; j++) {
      for (let k = 0; k < data[i][j].length; k++) {
        string = string.concat(`"${data[i][j][k]}",`);
      }
      string = string.concat(`\n`);
    }
    if (file !== "single") {
      fs.writeFileSync(`./data/tables/table${i + 1}.csv`, string);
    }
    page = page.concat(`${string}\n`);
  }
  if (file !== "multiple") {
    fs.writeFileSync(`./data/page.csv`, page);
  }
}

function transpose(arr) {
  return Object.keys(arr[0]).map(column => {
    return arr.map(row => {
      return row[column];
    });
  });
}
