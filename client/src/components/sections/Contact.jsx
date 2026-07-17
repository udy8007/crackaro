import { useState } from "react";
import { submitEnquiry } from "../../api/enquiries";

const INITIAL_FORM = {
  name: "",
  phone: "",
  email: "",
  interest: "",
  message: "",
};

export default function Contact() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [note, setNote] = useState("");
  const [noteType, setNoteType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setNote("");
    setNoteType("");

    try {
      await submitEnquiry(form);
      setNote(
        "Thank you! Your enquiry has been received. We will contact you shortly."
      );
      setNoteType("success");
      setForm(INITIAL_FORM);
    } catch (error) {
      setNote(error.message || "Something went wrong. Please try again.");
      setNoteType("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section" id="contact">
      <div className="container contact-grid">
        <div className="contact-info">
          <p className="eyebrow">Contact Us</p>
          <h2>Request a quote or ask a question</h2>
          <p className="section-desc">
            For product purchases, use Add to Cart and Place Order. This form is
            for general enquiries and wholesale questions.
          </p>

          <div className="contact-list">
            <div>
              <i className="fa-solid fa-location-dot"></i>
              <div>
                <h3>Showroom</h3>
                <p>12, Crackers Market Road, Sivakasi, Tamil Nadu 626123</p>
              </div>
            </div>
            <div>
              <i className="fa-solid fa-phone"></i>
              <div>
                <h3>Phone / WhatsApp</h3>
                <p>+91 98765 43210 · +91 91234 56789</p>
              </div>
            </div>
            <div>
              <i className="fa-solid fa-clock"></i>
              <div>
                <h3>Business Hours</h3>
                <p>
                  Mon – Sat: 9:00 AM – 8:00 PM
                  <br />
                  Sunday: 10:00 AM – 6:00 PM
                </p>
              </div>
            </div>
          </div>
        </div>

        <form className="contact-form" id="contactForm" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Your name"
                required
                value={form.name}
                onChange={updateField}
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                placeholder="+91 XXXXX XXXXX"
                required
                value={form.phone}
                onChange={updateField}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={updateField}
            />
          </div>
          <div className="form-group">
            <label htmlFor="interest">Interested In</label>
            <select
              id="interest"
              name="interest"
              value={form.interest}
              onChange={updateField}
            >
              <option value="">Select an option</option>
              <option value="retail">Retail Order</option>
              <option value="wholesale">Wholesale / Dealer</option>
              <option value="family">Family Delight Pack</option>
              <option value="diwali">Grand Diwali Pack</option>
              <option value="wedding">Wedding Special Pack</option>
              <option value="custom">Custom Requirement</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              rows="4"
              placeholder="Tell us about quantity, city, and preferred delivery date"
              required
              value={form.message}
              onChange={updateField}
            ></textarea>
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block"
            disabled={submitting}
          >
            <i className="fa-solid fa-paper-plane"></i>{" "}
            {submitting ? "Sending..." : "Send Enquiry"}
          </button>
          <p
            className={`form-note${noteType ? ` ${noteType}` : ""}`}
            id="formNote"
            aria-live="polite"
          >
            {note}
          </p>
        </form>
      </div>
    </section>
  );
}
