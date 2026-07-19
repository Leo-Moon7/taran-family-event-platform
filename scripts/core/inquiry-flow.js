(function () {
  "use strict";

  function providerIds(params = new URLSearchParams(location.search)) {
    return [...new Set((params.get("providers") || "").split(",").map((value) => value.trim()).filter(Boolean))].slice(0, 3);
  }

  function normalize(formData, ids) {
    const requirements = formData.getAll("requirements").filter(Boolean);
    return {
      client_id: crypto.randomUUID(),
      provider_ids: ids,
      event_type: String(formData.get("eventType") || ""),
      event_detail: String(formData.get("eventDetail") || ""),
      event_date: formData.get("eventDate") || null,
      date_flexible: formData.get("dateFlexible") === "on",
      region: String(formData.get("region") || ""),
      guest_count: Number(formData.get("guestCount") || 0),
      budget_min: Number(formData.get("budgetMin") || 0),
      budget_max: Number(formData.get("budgetMax") || 0),
      space_type: String(formData.get("spaceType") || ""),
      requirements,
      request_note: String(formData.get("requestNote") || "").trim(),
      contact: {
        name: String(formData.get("contactName") || "").trim(),
        phone: String(formData.get("contactPhone") || "").trim(),
        email: String(formData.get("contactEmail") || "").trim()
      },
      status: "submitted",
      created_at: new Date().toISOString()
    };
  }

  async function submit(payload) {
    if (!window.TaranConfig?.isSupabaseConfigured) {
      const drafts = JSON.parse(window.TaranStorage?.get("inquiry-drafts", "[]") || "[]");
      window.TaranStorage?.set("inquiry-drafts", JSON.stringify([payload, ...drafts].slice(0, 20)));
      return { mode: "local", id: payload.client_id };
    }
    const result = await window.TaranApi.rpc("taran_create_inquiry_group", {
      p_provider_ids: payload.provider_ids,
      p_payload: payload
    });
    return { mode: "online", id: result?.id || result };
  }

  window.TaranInquiryFlow = Object.freeze({ providerIds, normalize, submit });
})();
