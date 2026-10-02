require "rails_helper"

RSpec.describe "Auth", type: :request do
  def sign_up(email: "manager@example.com", password: "password123", fpl_team_id: 1234567)
    post "/sign_up", params: { email: email, password: password, fpl_team_id: fpl_team_id }
  end

  describe "POST /sign_up" do
    it "creates a user and returns a session token" do
      sign_up

      expect(response).to have_http_status(:created)
      body = JSON.parse(response.body)
      expect(body["user"]).to eq("email" => "manager@example.com", "fpl_team_id" => 1234567)
      expect(body["token"]).to be_a(String)
      assert_response_schema_confirm(201)
    end

    it "returns 422 on a duplicate email" do
      sign_up
      sign_up

      expect(response).to have_http_status(:unprocessable_entity)
      expect(JSON.parse(response.body)).to eq("message" => "Email has already been taken")
      assert_response_schema_confirm(422)
    end

    it "returns 422 when the password is too short" do
      sign_up(password: "short")

      expect(response).to have_http_status(:unprocessable_entity)
      assert_response_schema_confirm(422)
    end
  end

  describe "POST /sessions (login)" do
    before { sign_up(email: "manager@example.com", password: "password123") }

    it "returns a session token for correct credentials" do
      post "/sessions", params: { email: "manager@example.com", password: "password123" }

      expect(response).to have_http_status(:created)
      body = JSON.parse(response.body)
      expect(body["user"]).to eq("email" => "manager@example.com", "fpl_team_id" => 1234567)
      assert_response_schema_confirm(201)
    end

    it "returns 401 for a wrong password" do
      post "/sessions", params: { email: "manager@example.com", password: "nope" }

      expect(response).to have_http_status(:unauthorized)
      expect(JSON.parse(response.body)).to eq("message" => "Incorrect email or password")
      assert_response_schema_confirm(401)
    end

    it "returns 401 for an unknown email" do
      post "/sessions", params: { email: "nobody@example.com", password: "password123" }

      expect(response).to have_http_status(:unauthorized)
      assert_response_schema_confirm(401)
    end
  end

  describe "GET /me" do
    it "returns the signed-in user" do
      sign_up
      token = JSON.parse(response.body)["token"]

      get "/me", headers: { "Authorization" => "Bearer #{token}" }

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)).to eq("email" => "manager@example.com", "fpl_team_id" => 1234567)
      assert_response_schema_confirm(200)
    end

    it "returns 401 with no token" do
      get "/me"

      expect(response).to have_http_status(:unauthorized)
      assert_response_schema_confirm(401)
    end

    it "returns 401 with a bogus token" do
      get "/me", headers: { "Authorization" => "Bearer garbage" }

      expect(response).to have_http_status(:unauthorized)
      assert_response_schema_confirm(401)
    end
  end

  describe "DELETE /sessions (logout)" do
    it "invalidates the session token" do
      sign_up
      token = JSON.parse(response.body)["token"]

      delete "/sessions", headers: { "Authorization" => "Bearer #{token}" }
      expect(response).to have_http_status(:no_content)

      get "/me", headers: { "Authorization" => "Bearer #{token}" }
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
