# Inbound rate limiting for the Rails API (BL-007 / Task 40).
#
# TDD-fpl-assistant.md "Failure modes and mitigations": rate-limit the API's
# own endpoints at 60 requests/minute/IP as a starting threshold, "explicitly
# tunable once real traffic exists" -> the single named constant below.
#
# The 429 response matches openapi.yaml components.responses.TooManyRequests:
# 429 status, a `Retry-After` header (stringified seconds), and a `{ message }` body.
class Rack::Attack
  # The one knob to tune post-launch.
  RATE_LIMIT_PER_MINUTE = 60

  throttle("api/ip", limit: RATE_LIMIT_PER_MINUTE, period: 60.seconds) do |req|
    req.ip
  end

  self.throttled_responder = lambda do |request|
    match_data = request.env["rack.attack.match_data"] || {}
    period = match_data[:period].to_i
    epoch_time = match_data[:epoch_time].to_i
    retry_after = period.zero? ? 60 : period - (epoch_time % period)

    headers = {
      "Content-Type" => "application/json",
      "Retry-After" => retry_after.to_s
    }
    body = { message: "Rate limit exceeded, please retry shortly" }.to_json

    [429, headers, [body]]
  end
end

# Throttle in development and production; test opts in per-spec.
Rack::Attack.enabled = !Rails.env.test?
