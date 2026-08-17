/**
 * Extraction contract for photographed job-work slips — the single source of
 * truth for the prompt and the response schemas.
 *
 * Deliberately a TypeScript module rather than a JSON file. The Vercel function
 * in api/ imports this, and JSON imports there proved fragile: Vercel compiles
 * api/ as NodeNext, where `import x from './x.json'` needs an import attribute,
 * while other toolchains in this repo want different syntax again. A plain .ts
 * module resolves identically everywhere and removes that whole class of build
 * failure. The evaluation script loads it through esbuild for the same reason.
 *
 * Every rule in the prompt comes from a specific failure observed in the five
 * real slips in samples/work-orders/. Do not simplify them away without checking
 * those images — each one is load-bearing:
 *
 *  - The party rule exists because all five slips are addressed "To: Kamil",
 *    so a naive read pulls the job worker as the party on every document.
 *  - The ditto rule exists because Varalakshmi's slip repeats items with a quote
 *    mark, and the sum-the-numbers rule is what finally made its nine
 *    quantities reconcile against the written total of 669.
 *  - The strikethrough and correction rules exist because that same slip has
 *    numbers that look struck out but are valid, and Kiva's has a red
 *    handwritten process replacing the printed one.
 *  - The illegibility rule exists because Govardan's slip is hole-punched
 *    straight through the item descriptions.
 *  - The two-digit-year rule exists because the date is the field it gets wrong
 *    most often, and it must say so rather than guess confidently.
 */

/** Names for the job worker receiving the order — never the party. */
export const RECIPIENT_ALIASES: readonly string[] = ["Kamil Jamal","Kamil","Kameel","Ameer Finishing","Ameer"];

export const EXTRACTION_PROMPT: string = "You are reading a photographed job-work slip from a saree finishing business, to pre-fill a work order form. A human will review everything you return, so your job is accuracy about what is actually on the page — not confident guessing.\n\n## What to extract\n\n1. **party_name** — the company that ISSUED this order.\n2. **work_order_number** — the document/challan/form number.\n3. **received_date** — the date on the document.\n4. **items** — each line of work, with its quantity.\n5. **document_total_quantity** — the total written on the slip, if there is one.\n\n## The party is the printed letterhead\n\nThe issuing company is the printed letterhead at the top of the page.\n\nThese slips are all addressed TO the job worker, whose name appears handwritten in a \"To:\" or \"Name:\" field. That handwritten name is NEVER the party. Treat these as the recipient and ignore them when identifying the party: Kamil Jamal, Kamil, Kameel, Ameer Finishing, Ameer — and any near-miss spelling of them.\n\nIf a slip has both a \"Billed to\" and a \"Dispatch To\"/\"Vendor\" block naming the recipient, the party is still the letterhead.\n\n## Reading the item table\n\n**An item is a job work and a quantity — nothing else.** Every item has exactly two meaningful parts: the work being done, and how many pieces. raw_text must contain only the words describing the work. Do not put fabric names, design numbers, HSN/SAC codes, rates, amounts, or column labels into it.\n\n**Several numbers on one line are all quantities for that job work — add them.** Where a handwritten line carries more than one number, or shows arithmetic such as \"129 = 66+63\", those are quantities for the single job work on that line. Return their sum as one quantity. Do not split the line into separate items, and do not return only one of the numbers.\n\n**Exception — printed tables with labelled columns.** When the table has printed headers (Qty, Rate, per, Amount, HSN/SAC, Design No), take the quantity from the quantity column alone. Numbers under the other headers are not quantities.\n\n**Struck-through numbers.** Do not discard a number because it looks crossed out. On these slips a struck line usually means overwritten or emphasised, not cancelled. Include it in the sum and flag the item struck_through so the reviewer can check it. The written total is the arbiter, not the strikethrough.\n\n**Ditto marks.** A quotation mark, a \"u\"-like squiggle, or a repeat symbol in the description column means \"same work as the line above\". Repeat only the description the mark sits directly beneath, and flag the item ditto_expanded. Do not carry a leading word from an earlier row onto every following line, and never return the mark itself as the description.\n\n**Handwritten corrections over printed text.** Handwriting over or beside a printed value — often in a different ink colour — is a correction that REPLACES the printed value. Use the handwritten version, discard the printed one, and flag handwritten_correction.\n\n**Illegible or missing text.** These are photographs of paper that has been folded, torn, and punched for ring binders. Where characters are physically missing or unreadable, return the part you can read and flag the item illegible. Never invent the missing text. A partial description the user can correct is far more useful than a plausible fabrication.\n\n**Descriptions verbatim.** Within those rules, return the work description exactly as written, including abbreviations and shorthand. Do not normalise spelling, expand abbreviations, translate, or map it to any standard vocabulary — that matching happens elsewhere. If it says \"double deco gum 1f\", return \"double deco gum 1f\".\n\n## Dates\n\nIndian convention: day/month/year. 13/8/26 is 13 August 2026. Two-digit years in the 20s are 20xx. Return ISO yyyy-MM-dd in value and the original characters in raw.\n\nHandwritten dates on these slips are the least reliable field on the page — single digits are routinely misread (3 for 8, 3 for 5, 6 for 4). Therefore: **whenever the year is written with two digits, set confidence to \"low\", even if the digits look clear.** Do the same whenever any digit could plausibly read as another, or day and month could be swapped, and say in notes which digit you were unsure of and what the alternatives were. Always put the characters as written in raw so the reviewer can check your reading against the page without reopening the photo.\n\n## Confidence\n\n- **high** — printed, or handwriting you can read without hesitation.\n- **medium** — legible handwriting with some doubt about specific characters.\n- **low** — you are guessing, or the layout is ambiguous.\n\nUse \"low\" freely. A field marked low gets human attention; a wrong field marked high does not.\n\n## Notes\n\nUse notes for anything the reviewer should know: line items whose sum does not match the written total, columns you found ambiguous, text lost to a tear or hole punch, a slip that looks like it contains more than one order. Write plainly, one observation per entry.\n\nReturn only the JSON described by the schema.";

/** Standard JSON Schema — for providers that accept it (Claude, OpenAI). */
export const EXTRACTION_SCHEMA = {
  "type": "object",
  "additionalProperties": false,
  "required": [
    "party_name",
    "work_order_number",
    "received_date",
    "items",
    "document_total_quantity",
    "notes"
  ],
  "properties": {
    "party_name": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "value",
        "confidence"
      ],
      "properties": {
        "value": {
          "type": [
            "string",
            "null"
          ]
        },
        "confidence": {
          "type": "string",
          "enum": [
            "high",
            "medium",
            "low"
          ]
        }
      }
    },
    "work_order_number": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "value",
        "confidence"
      ],
      "properties": {
        "value": {
          "type": [
            "string",
            "null"
          ]
        },
        "confidence": {
          "type": "string",
          "enum": [
            "high",
            "medium",
            "low"
          ]
        }
      }
    },
    "received_date": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "value",
        "raw",
        "confidence"
      ],
      "properties": {
        "value": {
          "type": [
            "string",
            "null"
          ]
        },
        "raw": {
          "type": [
            "string",
            "null"
          ]
        },
        "confidence": {
          "type": "string",
          "enum": [
            "high",
            "medium",
            "low"
          ]
        }
      }
    },
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "raw_text",
          "quantity",
          "confidence",
          "flags"
        ],
        "properties": {
          "raw_text": {
            "type": "string"
          },
          "quantity": {
            "type": [
              "integer",
              "null"
            ]
          },
          "confidence": {
            "type": "string",
            "enum": [
              "high",
              "medium",
              "low"
            ]
          },
          "flags": {
            "type": "array",
            "items": {
              "type": "string",
              "enum": [
                "ditto_expanded",
                "struck_through",
                "illegible",
                "ambiguous_quantity",
                "handwritten_correction"
              ]
            }
          }
        }
      }
    },
    "document_total_quantity": {
      "type": [
        "integer",
        "null"
      ]
    },
    "notes": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  }
} as const;

/**
 * Gemini's `responseSchema` dialect: an OpenAPI 3.0 subset that rejects
 * `additionalProperties` and type unions, expressing nullability with
 * `nullable: true` instead.
 */
export const EXTRACTION_SCHEMA_GEMINI = {
  "type": "object",
  "propertyOrdering": [
    "party_name",
    "work_order_number",
    "received_date",
    "items",
    "document_total_quantity",
    "notes"
  ],
  "required": [
    "party_name",
    "work_order_number",
    "received_date",
    "items",
    "document_total_quantity",
    "notes"
  ],
  "properties": {
    "party_name": {
      "type": "object",
      "propertyOrdering": [
        "value",
        "confidence"
      ],
      "required": [
        "value",
        "confidence"
      ],
      "properties": {
        "value": {
          "type": "string",
          "nullable": true
        },
        "confidence": {
          "type": "string",
          "enum": [
            "high",
            "medium",
            "low"
          ]
        }
      }
    },
    "work_order_number": {
      "type": "object",
      "propertyOrdering": [
        "value",
        "confidence"
      ],
      "required": [
        "value",
        "confidence"
      ],
      "properties": {
        "value": {
          "type": "string",
          "nullable": true
        },
        "confidence": {
          "type": "string",
          "enum": [
            "high",
            "medium",
            "low"
          ]
        }
      }
    },
    "received_date": {
      "type": "object",
      "propertyOrdering": [
        "value",
        "raw",
        "confidence"
      ],
      "required": [
        "value",
        "raw",
        "confidence"
      ],
      "properties": {
        "value": {
          "type": "string",
          "nullable": true
        },
        "raw": {
          "type": "string",
          "nullable": true
        },
        "confidence": {
          "type": "string",
          "enum": [
            "high",
            "medium",
            "low"
          ]
        }
      }
    },
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "propertyOrdering": [
          "raw_text",
          "quantity",
          "confidence",
          "flags"
        ],
        "required": [
          "raw_text",
          "quantity",
          "confidence",
          "flags"
        ],
        "properties": {
          "raw_text": {
            "type": "string"
          },
          "quantity": {
            "type": "integer",
            "nullable": true
          },
          "confidence": {
            "type": "string",
            "enum": [
              "high",
              "medium",
              "low"
            ]
          },
          "flags": {
            "type": "array",
            "items": {
              "type": "string",
              "enum": [
                "ditto_expanded",
                "struck_through",
                "illegible",
                "ambiguous_quantity",
                "handwritten_correction"
              ]
            }
          }
        }
      }
    },
    "document_total_quantity": {
      "type": "integer",
      "nullable": true
    },
    "notes": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  }
} as const;
