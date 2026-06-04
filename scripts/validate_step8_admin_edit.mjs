import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const source = JSON.parse(await readFile("src/data/vocab.json", "utf8"));
const target = source.data[0];
const tempDir = await mkdtemp(path.join(tmpdir(), "qingvoca-admin-edit-"));
const vocabPath = path.join(tempDir, "vocab.json");
const editsPath = path.join(tempDir, "edits.json");
const outputPath = path.join(tempDir, "out.json");

await writeFile(vocabPath, JSON.stringify(source, null, 2));
await writeFile(
  editsPath,
  JSON.stringify(
    {
      edits: [
        {
          id: target.id,
          word: target.word,
          pinyin: `${target.pinyin} test`,
          translations: {
            ko: "관리자 편집 검증",
            en: "admin edit validation",
          },
          pos: "test-pos",
          lessonId: 3,
          example: ["example sentence"],
        },
      ],
    },
    null,
    2,
  ),
);

const result = spawnSync("node", ["scripts/sync-admin-edits-to-local.mjs", vocabPath, editsPath, outputPath], {
  encoding: "utf8",
});

if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(result.status ?? 1);
}

const output = JSON.parse(await readFile(outputPath, "utf8"));
const edited = output.data.find((entry) => entry.id === target.id);
const errors = [];

if (!edited) errors.push("edited entry missing");
if (edited.pinyin !== `${target.pinyin} test`) errors.push("pinyin was not updated");
if (edited.reading !== edited.pinyin || edited.furigana !== edited.pinyin) errors.push("reading compatibility fields were not updated");
if (edited.meaning !== "관리자 편집 검증") errors.push("meaning did not use updated ko translation");
if (edited.translations.en !== "admin edit validation") errors.push("en translation was not updated");
if (edited.pos !== "test-pos") errors.push("pos was not updated");
if (edited.lessonId !== 3 || edited.step !== 2 || edited.level !== 2) errors.push("lessonId/step/level were not normalized");
if (edited.hsk !== "HSK4" || edited.jlpt !== "HSK4") errors.push("hsk/jlpt should stay fixed");
if (edited.band !== "BASIC" || edited.opic !== "BASIC") errors.push("band/opic were not normalized");
if (edited.example.length !== 1) errors.push("example was not updated");
if (output.meta.adminEditCount !== 1) errors.push("admin edit metadata missing");

if (errors.length > 0) {
  for (const error of errors) console.error(`[step8] ${error}`);
  process.exitCode = 1;
} else {
  console.log("[step8] validation complete");
  console.log("[step8] admin edit merge updates editable fields");
  console.log("[step8] hsk/jlpt remain fixed at HSK4");
  console.log("[step8] pinyin compatibility fields and step fields are normalized");
}
