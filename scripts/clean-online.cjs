(async () => {
  const cs = "postgresql://neondb_owner:npg_HI5kd4osymre@ep-orange-sky-b3icvetz-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
  const u = new URL(cs);
  const q = async (query, params = []) => {
    const r = await fetch("https://" + u.hostname + "/sql", {
      method: "POST",
      headers: { "Neon-Connection-String": cs, "Content-Type": "application/json" },
      body: JSON.stringify({ query, params }),
    });
    return r.status;
  };
  console.log("del comment:", await q("DELETE FROM comments WHERE id = $1", ["online-test-c1"]));
  console.log("del post:", await q("DELETE FROM posts WHERE id = $1", ["online-test-1"]));
  console.log("posts count:", await q("SELECT count(*) FROM posts"));
})();
