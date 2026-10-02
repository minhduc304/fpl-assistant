# POST /sign_up (openapi.yaml's signUp operation).
class UsersController < ApplicationController
  def create
    user = User.new(user_params)
    if user.save
      _session, raw_token = Session.create_for(user)
      render json: { token: raw_token, user: serialize(user) }, status: :created
    else
      render json: { message: user.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  private

  def user_params
    params.permit(:email, :password, :fpl_team_id)
  end

  def serialize(user)
    { email: user.email, fpl_team_id: user.fpl_team_id }
  end
end
